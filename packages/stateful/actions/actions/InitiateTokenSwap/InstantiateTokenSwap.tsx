import { useWallet } from '@noahsaso/cosmodal'
import { useCallback, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import toast from 'react-hot-toast'
import { constSelector, useRecoilValueLoadable } from 'recoil'

import {
  CwdCoreV2Selectors,
  nativeBalancesSelector,
} from '@dao-dao/state/recoil'
import { Loader } from '@dao-dao/stateless'
import { useCachedLoadable } from '@dao-dao/stateless/hooks/useCachedLoadable'
import { ActionComponent, ActionOptionsContextType } from '@dao-dao/types'
import { InstantiateMsg } from '@dao-dao/types/contracts/CwTokenSwap'
import {
  CHAIN_BECH32_PREFIX,
  CODE_ID_CONFIG,
  NATIVE_DENOM,
  convertDenomToMicroDenomWithDecimals,
  isValidAddress,
  loadableToLoadingData,
  nativeTokenDecimals,
  processError,
} from '@dao-dao/utils'

import { ProfileDisplay } from '../../../components'
import { useCw20GovernanceTokenInfoResponseIfExists } from '../../../voting-module-adapter/react/hooks/useCw20GovernanceTokenInfoResponseIfExists'
import {
  InitiateTokenSwapData,
  InstantiateTokenSwapOptions,
  InstantiateTokenSwap as StatelessInstantiateTokenSwap,
} from '../../components/InitiateTokenSwap'
import { useActionOptions } from '../../react'

export const InstantiateTokenSwap: ActionComponent<
  undefined,
  InitiateTokenSwapData
> = (props) => {
  const { address: selfAddress, context, chainId, t } = useActionOptions()
  const { setValue } = useFormContext()
  const { address: walletAddress, signingCosmWasmClient } = useWallet()

  // Get CW20 governance token address from voting module adapter if exists,
  // so we can make sure to load it with all cw20 balances, even if it has not
  // been explicitly added to the DAO.
  const { governanceTokenAddress } =
    useCw20GovernanceTokenInfoResponseIfExists() ?? {}

  // Load balances as loadables since they refresh automatically on a timer.
  const selfPartyNativeBalancesLoadable = useCachedLoadable(
    nativeBalancesSelector({
      address: selfAddress,
      chainId,
    })
  )
  const selfPartyNativeBalances =
    selfPartyNativeBalancesLoadable.state === 'hasValue'
      ? selfPartyNativeBalancesLoadable.contents.map(({ amount, denom }) => ({
          amount,
          denom,
        }))
      : undefined
  const selfPartyCw20BalancesLoadable = useCachedLoadable(
    context.type === ActionOptionsContextType.Dao
      ? // Get DAO's cw20 balances and infos.
        CwdCoreV2Selectors.allCw20BalancesAndInfosSelector({
          contractAddress: selfAddress,
          chainId,
          governanceTokenAddress,
        })
      : undefined
  )
  const selfPartyCw20Balances =
    context.type === ActionOptionsContextType.Dao
      ? selfPartyCw20BalancesLoadable.state === 'hasValue'
        ? selfPartyCw20BalancesLoadable.contents.map(
            ({ addr, balance, info }) => ({
              address: addr,
              balance,
              info,
            })
          )
        : undefined
      : // If not a DAO, just use empty array. Can't fetch all CW20s for a wallet without an indexer.
        []

  const [instantiating, setInstantiating] = useState(false)
  const onInstantiate = useCallback(async () => {
    const { instantiateData } = props.data

    if (!instantiateData) {
      toast.error(t('error.loadingData'))
      return
    }

    if (!walletAddress || !signingCosmWasmClient) {
      toast.error(t('error.connectWalletToContinue'))
      return
    }

    setInstantiating(true)

    try {
      const instantiateMsg: InstantiateMsg = {
        counterparty_one: {
          address: selfAddress,
          promise:
            instantiateData.selfParty.type === 'cw20'
              ? {
                  cw20: {
                    contract_addr: instantiateData.selfParty.denomOrAddress,
                    amount: convertDenomToMicroDenomWithDecimals(
                      instantiateData.selfParty.amount,
                      instantiateData.selfParty.decimals
                    ).toString(),
                  },
                }
              : {
                  native: {
                    denom: instantiateData.selfParty.denomOrAddress,
                    amount: convertDenomToMicroDenomWithDecimals(
                      instantiateData.selfParty.amount,
                      instantiateData.selfParty.decimals
                    ).toString(),
                  },
                },
        },
        counterparty_two: {
          address: instantiateData.counterparty.address,
          promise:
            instantiateData.counterparty.type === 'cw20'
              ? {
                  cw20: {
                    contract_addr: instantiateData.counterparty.denomOrAddress,
                    amount: convertDenomToMicroDenomWithDecimals(
                      instantiateData.counterparty.amount,
                      instantiateData.counterparty.decimals
                    ).toString(),
                  },
                }
              : {
                  native: {
                    denom: instantiateData.counterparty.denomOrAddress,
                    amount: convertDenomToMicroDenomWithDecimals(
                      instantiateData.counterparty.amount,
                      instantiateData.counterparty.decimals
                    ).toString(),
                  },
                },
        },
      }

      const { contractAddress } = await signingCosmWasmClient.instantiate(
        walletAddress,
        CODE_ID_CONFIG.CwTokenSwap,
        instantiateMsg,
        `TokenSwap_${instantiateData.selfParty.denomOrAddress}_${instantiateData.counterparty.denomOrAddress}`,
        'auto'
      )

      // Update action form data with address.
      setValue(
        props.fieldNamePrefix + 'tokenSwapContractAddress',
        contractAddress
      )
      // Display success.
      toast.success(t('success.tokenSwapContractInstantiated'))
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setInstantiating(false)
    }
  }, [
    props.data,
    props.fieldNamePrefix,
    selfAddress,
    setValue,
    signingCosmWasmClient,
    t,
    walletAddress,
  ])

  return selfPartyNativeBalances === undefined ||
    selfPartyCw20Balances === undefined ? (
    <Loader />
  ) : (
    <InnerInstantiateTokenSwap
      {...props}
      options={{
        selfPartyCw20Balances,
        selfPartyNativeBalances,
        instantiating,
        onInstantiate,
        ProfileDisplay,
      }}
    />
  )
}

const InnerInstantiateTokenSwap: ActionComponent<
  Omit<
    InstantiateTokenSwapOptions,
    'counterpartyNativeBalances' | 'counterpartyCw20Balances'
  >
> = (props) => {
  const { chainId } = useActionOptions()
  const { resetField, watch } = useFormContext()

  const [defaultsSet, setDefaultsSet] = useState(false)
  // Set form defaults on load.
  useEffect(() => {
    // Default selfParty to first CW20 if present. Otherwise, native.
    const selfPartyDefaultCw20 =
      props.options.selfPartyCw20Balances &&
      props.options.selfPartyCw20Balances.length > 0
        ? props.options.selfPartyCw20Balances[0]
        : undefined

    resetField(props.fieldNamePrefix + 'instantiateData', {
      defaultValue: {
        selfParty: {
          type: selfPartyDefaultCw20 ? 'cw20' : 'native',
          denomOrAddress: selfPartyDefaultCw20
            ? selfPartyDefaultCw20.address
            : NATIVE_DENOM,
          amount: 0,
          decimals: selfPartyDefaultCw20
            ? selfPartyDefaultCw20.info.decimals
            : nativeTokenDecimals(NATIVE_DENOM) ?? 0,
        },
        counterparty: {
          address: '',
          type: 'native',
          denomOrAddress: NATIVE_DENOM,
          amount: 0,
          decimals: nativeTokenDecimals(NATIVE_DENOM) ?? 0,
        },
      },
    })

    setDefaultsSet(true)
    // Only run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counterpartyAddress: string | undefined = watch(
    props.fieldNamePrefix + 'instantiateData.counterparty.address'
  )

  // Load balances as loadables since they refresh automatically on a timer.
  const counterpartyNativeBalances = loadableToLoadingData(
    useCachedLoadable(
      counterpartyAddress &&
        isValidAddress(counterpartyAddress, CHAIN_BECH32_PREFIX)
        ? nativeBalancesSelector({
            address: counterpartyAddress,
            chainId,
          })
        : undefined
    ),
    []
  )

  //! Try to get CW20s assuming it's a DAO.
  const counterpartyAddressIsContract =
    counterpartyAddress &&
    isValidAddress(counterpartyAddress, CHAIN_BECH32_PREFIX)

  // Try to retrieve governance token address, failing if not a cw20-based DAO.
  const counterpartyDaoGovernanceTokenAddress = useRecoilValueLoadable(
    counterpartyAddressIsContract
      ? CwdCoreV2Selectors.tryFetchGovernanceTokenAddressSelector({
          contractAddress: counterpartyAddress,
          chainId,
        })
      : constSelector(undefined)
  )
  // Try to get cw20 balances, failing if not a DAO.
  const counterpartyDaoCw20Balances = loadableToLoadingData(
    useCachedLoadable(
      counterpartyAddressIsContract &&
        counterpartyDaoGovernanceTokenAddress.state !== 'loading'
        ? // Get DAO's cw20 balances and infos.
          CwdCoreV2Selectors.allCw20BalancesAndInfosSelector({
            contractAddress: counterpartyAddress,
            chainId,
            governanceTokenAddress:
              // If did not error.
              counterpartyDaoGovernanceTokenAddress.state === 'hasValue'
                ? counterpartyDaoGovernanceTokenAddress.contents
                : undefined,
          })
        : undefined
    ),
    // Default to empty array if errors.
    []
  )

  // Wait for defaults to be set before loading component with form inputs.
  return defaultsSet ? (
    <StatelessInstantiateTokenSwap
      {...props}
      options={{
        ...props.options,
        counterpartyCw20Balances:
          counterpartyDaoCw20Balances.loading || !counterpartyAddressIsContract
            ? { loading: true }
            : {
                loading: false,
                data: counterpartyDaoCw20Balances.data.map(
                  ({ addr, balance, info }) => ({
                    address: addr,
                    balance,
                    info,
                  })
                ),
              },
        counterpartyNativeBalances,
      }}
    />
  ) : (
    <Loader />
  )
}
