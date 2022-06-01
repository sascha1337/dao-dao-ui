import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import {
  FieldPath,
  FieldValues,
  FormState,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  UseFormClearErrors,
  UseFormSetError,
} from 'react-hook-form'
import toast from 'react-hot-toast'
import { useRecoilState } from 'recoil'

import { useWallet } from '@dao-dao/state'
import { InstantiateMsg as CwCoreInstantiateMsg } from '@dao-dao/state/clients/cw-core'
import { InstantiateMsg as CwProposalSingleInstantiateMsg } from '@dao-dao/state/clients/cw-proposal-single'
import {
  Cw20Coin,
  InstantiateMsg as Cw20StakedBalanceVotingInstantiateMsg,
} from '@dao-dao/state/clients/cw20-staked-balance-voting'
import {
  InstantiateMsg as Cw4VotingInstantiateMsg,
  Member,
} from '@dao-dao/state/clients/cw4-voting'
import { useInstantiate } from '@dao-dao/state/hooks/cw-core'
import { SubmitButton } from '@dao-dao/ui'
import {
  convertDenomToMicroDenomWithDecimals,
  CW20STAKEDBALANCEVOTING_CODE_ID,
  CW20_CODE_ID,
  CW4GROUP_CODE_ID,
  CW4VOTING_CODE_ID,
  CWCORE_CODE_ID,
  CWPROPOSALSINGLE_CODE_ID,
  STAKECW20_CODE_ID,
  validateCw20StakedBalanceVotingInstantiateMsg,
  validateCw4VotingInstantiateMsg,
  validateCwProposalSingleInstantiateMsg,
} from '@dao-dao/utils'

import {
  convertDurationWithUnitsToDuration,
  convertThresholdValueToPercentageThreshold,
  GovernanceTokenType,
  NewOrg,
  newOrgAtom,
  NEW_ORG_CW20_DECIMALS,
} from '@/atoms/org'

export type CustomValidation = (
  values: NewOrg,
  errors: FormState<NewOrg>['errors'],
  setError: UseFormSetError<NewOrg>,
  clearErrors: UseFormClearErrors<NewOrg>,
  noNewErrors?: boolean
) => boolean

interface OrgFormPage {
  href: string
  label: string
  ensureFieldSetBeforeContinuing?: FieldPath<NewOrg>
}

export const createOrgFormPages: OrgFormPage[] = [
  {
    href: '/org/create',
    label: '1. Describe your org',
    ensureFieldSetBeforeContinuing: 'name',
  },
  {
    href: '/org/create/voting',
    label: '2. Configure voting',
  },
  {
    href: '/org/create/review',
    label: '3. Review and submit',
  },
]

enum CreateOrgSubmitLabel {
  Back = 'Back',
  Continue = 'Continue',
  Review = 'Review',
  CreateOrg = 'Create Org',
}

export const useCreateOrgForm = (
  pageIndex: number,
  customValidation?: CustomValidation
) => {
  const router = useRouter()
  const [newOrg, setNewOrg] = useRecoilState(newOrgAtom)
  const { connected, address: walletAddress } = useWallet()

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    watch,
    control,
    setValue,
    resetField,
    setError,
    clearErrors,
  } = useForm({ defaultValues: newOrg })

  // Ensure previous pages are valid and navigate if not.
  useEffect(() => {
    if (!router.isReady) return

    const invalidPreviousPage = createOrgFormPages.find(
      ({ ensureFieldSetBeforeContinuing }, idx) =>
        idx < pageIndex &&
        !!ensureFieldSetBeforeContinuing &&
        !getValues(ensureFieldSetBeforeContinuing)
    )
    if (invalidPreviousPage) {
      router.push(invalidPreviousPage.href)
    }
  }, [router, pageIndex, getValues])

  const instantiate = useInstantiate({
    codeId: CWCORE_CODE_ID,
    sender: walletAddress ?? '',
  })

  const onSubmit: SubmitHandler<NewOrg> = useCallback(
    async (values, event) => {
      const nativeEvent = event?.nativeEvent as SubmitEvent
      const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

      // Create the org.
      if (submitterValue === CreateOrgSubmitLabel.CreateOrg) {
        if (connected) {
          createOrg(instantiate, values)
        } else {
          toast.error('Connect a wallet to create an org.')
        }

        return
      }

      // Continue to the next page.
      setNewOrg((prevNewOrg) => ({
        ...prevNewOrg,
        ...values,
      }))

      router.push(
        createOrgFormPages[
          submitterValue === CreateOrgSubmitLabel.Back
            ? Math.max(0, pageIndex - 1)
            : submitterValue === CreateOrgSubmitLabel.Review
            ? createOrgFormPages.length - 1
            : Math.min(createOrgFormPages.length - 1, pageIndex + 1)
        ].href
      )
    },
    [setNewOrg, router, pageIndex, connected, instantiate]
  )

  const onError: SubmitErrorHandler<FieldValues> = useCallback(
    (_, event) => {
      const nativeEvent = event?.nativeEvent as SubmitEvent
      const submitterValue = (nativeEvent?.submitter as HTMLInputElement)?.value

      // Allow Back press without required fields.
      if (submitterValue === CreateOrgSubmitLabel.Back)
        return onSubmit(getValues(), event)
    },
    [getValues, onSubmit]
  )

  const currentPage = useMemo(() => createOrgFormPages[pageIndex], [pageIndex])
  const showBack = useMemo(() => pageIndex > 0, [pageIndex])
  const showNext = useMemo(
    () => pageIndex < createOrgFormPages.length,
    [pageIndex]
  )
  const Navigation = (
    <div
      className="flex flex-row items-center mt-8"
      // justify-end doesn't work in tailwind for some reason
      style={{ justifyContent: showBack ? 'space-between' : 'flex-end' }}
    >
      {showBack && (
        <SubmitButton label={CreateOrgSubmitLabel.Back} variant="secondary" />
      )}
      {showNext && (
        <SubmitButton
          disabled={
            !router.isReady ||
            (!!currentPage.ensureFieldSetBeforeContinuing &&
              !watch(currentPage.ensureFieldSetBeforeContinuing))
          }
          label={
            pageIndex < createOrgFormPages.length - 2
              ? CreateOrgSubmitLabel.Continue
              : pageIndex === createOrgFormPages.length - 2
              ? CreateOrgSubmitLabel.Review
              : CreateOrgSubmitLabel.CreateOrg
          }
        />
      )}
    </div>
  )

  const _handleSubmit = useMemo(
    () => handleSubmit(onSubmit, onError),
    [handleSubmit, onSubmit, onError]
  )

  const formOnSubmit = useCallback(
    (...args: Parameters<typeof _handleSubmit>) => {
      // Validate here instead of in onSubmit since custom errors prevent
      // form submission. customValidation will set/clear custom errors.
      customValidation?.(getValues(), errors, setError, clearErrors)

      return _handleSubmit(...args)
    },
    [_handleSubmit, customValidation, getValues, errors, setError, clearErrors]
  )

  return {
    formOnSubmit,
    errors,
    register,
    getValues,
    watch,
    control,
    setValue,
    resetField,
    setError,
    clearErrors,
    Navigation,
  }
}

const createOrg = async (
  instantiate: ReturnType<typeof useInstantiate>,
  values: NewOrg
) => {
  const {
    name,
    description,
    imageUrl,
    groups,
    votingDuration,
    governanceTokenEnabled,
    governanceTokenOptions: {
      unregisterDuration,
      newGovernanceToken,
      existingGovernanceTokenAddress,
      proposalDeposit,
      ...governanceTokenOptions
    },
    thresholdQuorum: { threshold, quorum },
  } = values

  try {
    let votingModuleInstantiateMsg
    if (governanceTokenEnabled) {
      let tokenInfo: Cw20StakedBalanceVotingInstantiateMsg['token_info']
      if (governanceTokenOptions.type === GovernanceTokenType.New) {
        if (!newGovernanceToken) {
          throw new Error('New governance token info not provided.')
        }

        const {
          initialSupply,
          initialTreasuryPercent,
          imageUrl,
          symbol,
          name,
        } = newGovernanceToken

        const microInitialSupply = Number(
          convertDenomToMicroDenomWithDecimals(
            initialSupply,
            NEW_ORG_CW20_DECIMALS
          )
        )

        // Distribute non-treasury supply to the members.
        const microBalanceToDistribute =
          microInitialSupply * (1 - initialTreasuryPercent / 100)
        const microInitialBalances: Cw20Coin[] =
          microBalanceToDistribute > 0
            ? groups.flatMap(({ weight, members }) =>
                members.map(({ address }) => ({
                  address,
                  amount: Math.round(
                    (microBalanceToDistribute * (weight / 100)) / members.length
                  ).toString(),
                }))
              )
            : []
        const microInitialBalanceDistributed = microInitialBalances.reduce(
          (acc, { amount }) => acc + Number(amount),
          0
        )
        // Compute treasury supply based on sum of distributed coins,
        // since amount rounding at micro decimals may affect the total.
        const microInitialDaoBalance = (
          microInitialSupply - microInitialBalanceDistributed
        ).toString()

        tokenInfo = {
          new: {
            code_id: CW20_CODE_ID,
            decimals: NEW_ORG_CW20_DECIMALS,
            initial_balances: microInitialBalances,
            initial_dao_balance: microInitialDaoBalance,
            label: name,
            marketing: imageUrl ? { logo: { url: imageUrl } } : null,
            name,
            staking_code_id: STAKECW20_CODE_ID,
            symbol,
            unstaking_duration:
              convertDurationWithUnitsToDuration(unregisterDuration),
          },
        }
      } else {
        if (!existingGovernanceTokenAddress) {
          throw new Error('Existing governance token address not provided.')
        }

        tokenInfo = {
          existing: {
            address: existingGovernanceTokenAddress,
            staking_contract: {
              new: {
                staking_code_id: STAKECW20_CODE_ID,
                unstaking_duration:
                  convertDurationWithUnitsToDuration(unregisterDuration),
              },
            },
          },
        }
      }

      const cw20StakedBalanceVotingInstantiateMsg: Cw20StakedBalanceVotingInstantiateMsg =
        { token_info: tokenInfo }

      validateCw20StakedBalanceVotingInstantiateMsg(
        cw20StakedBalanceVotingInstantiateMsg
      )
      votingModuleInstantiateMsg = cw20StakedBalanceVotingInstantiateMsg
    } else {
      const initialMembers: Member[] = groups.flatMap(({ weight, members }) =>
        members.map(({ address }) => ({
          addr: address,
          weight,
        }))
      )

      const cw4VotingInstantiateMsg: Cw4VotingInstantiateMsg = {
        cw4_group_code_id: CW4GROUP_CODE_ID,
        initial_members: initialMembers,
      }

      validateCw4VotingInstantiateMsg(cw4VotingInstantiateMsg)
      votingModuleInstantiateMsg = cw4VotingInstantiateMsg
    }

    const cwProposalSingleModuleInstantiateMsg: CwProposalSingleInstantiateMsg =
      {
        allow_revoting: false,
        deposit_info:
          governanceTokenEnabled &&
          typeof proposalDeposit?.value === 'number' &&
          proposalDeposit.value > 0
            ? {
                deposit: proposalDeposit.value.toString(),
                refund_failed_proposals: proposalDeposit.refundFailed,
                token: { voting_module_token: {} },
              }
            : null,
        max_voting_period: convertDurationWithUnitsToDuration(votingDuration),
        only_members_execute: true,
        threshold: {
          threshold_quorum: {
            quorum: convertThresholdValueToPercentageThreshold(quorum),
            threshold: convertThresholdValueToPercentageThreshold(threshold),
          },
        },
      }
    validateCwProposalSingleInstantiateMsg(cwProposalSingleModuleInstantiateMsg)

    const msg: CwCoreInstantiateMsg = {
      admin: null,
      automatically_add_cw20s: true,
      automatically_add_cw721s: true,
      description,
      image_url: imageUrl ?? null,
      name,
      proposal_modules_instantiate_info: [
        {
          admin: { core_contract: {} },
          code_id: CWPROPOSALSINGLE_CODE_ID,
          label: `org_${name}_cw-proposal-single`,
          msg: Buffer.from(
            JSON.stringify(cwProposalSingleModuleInstantiateMsg),
            'utf8'
          ).toString('base64'),
        },
      ],
      voting_module_instantiate_info: {
        admin: { core_contract: {} },
        code_id: governanceTokenEnabled
          ? CW20STAKEDBALANCEVOTING_CODE_ID
          : CW4VOTING_CODE_ID,
        label: governanceTokenEnabled
          ? `org_${name}_cw20-staked-balance-voting`
          : `org_${name}_cw4-voting`,
        msg: Buffer.from(
          JSON.stringify(votingModuleInstantiateMsg),
          'utf8'
        ).toString('base64'),
      },
    }

    await instantiate(msg, msg.name)
  } catch (err) {
    console.error(err)
    toast.error('Failed to create org.')
  }
}