import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  AddressInput,
  Button,
  InputErrorMessage,
  InputLabel,
  Loader,
  NumberInput,
  SelectInput,
} from '@dao-dao/stateless'
import { ActionComponent } from '@dao-dao/types'
import {
  CHAIN_BECH32_PREFIX,
  convertMicroDenomToDenomWithDecimals,
  isValidAddress,
  nativeTokenDecimals,
  nativeTokenLabel,
  validateAddress,
  validatePositive,
  validateRequired,
} from '@dao-dao/utils'

import { InstantiateTokenSwapOptions } from './types'

// Form displayed when the user is instantiating a new token swap.
export const InstantiateTokenSwap: ActionComponent<
  InstantiateTokenSwapOptions
> = ({
  fieldNamePrefix,
  errors,
  options: {
    selfPartyNativeBalances,
    selfPartyCw20Balances,
    counterpartyCw20Balances,
    counterpartyNativeBalances,
    onInstantiate,
    instantiating,
    ProfileDisplay,
  },
}) => {
  const { t } = useTranslation()

  const { register, watch, setValue, trigger, setError } = useFormContext()

  const selfParty = watch(fieldNamePrefix + 'instantiateData.selfParty')
  const counterparty = watch(fieldNamePrefix + 'instantiateData.counterparty')

  const selfCw20 = selfPartyCw20Balances.find(
    ({ address }) => selfParty.denomOrAddress === address
  )
  const selfDecimals = selfCw20
    ? selfCw20.info.decimals
    : nativeTokenDecimals(selfParty.denomOrAddress) ?? 0
  const selfMin = convertMicroDenomToDenomWithDecimals(1, selfDecimals)
  const selfMax = convertMicroDenomToDenomWithDecimals(
    selfCw20
      ? selfCw20.balance
      : selfPartyNativeBalances.find(
          ({ denom }) => selfParty.denomOrAddress === denom
        )?.amount ?? 0,
    selfDecimals
  )
  const selfSymbol =
    selfCw20?.info.symbol ?? nativeTokenLabel(selfParty.denomOrAddress)

  const counterpartyCw20 = counterpartyCw20Balances.loading
    ? undefined
    : counterpartyCw20Balances.data.find(
        ({ address }) => counterparty.denomOrAddress === address
      )
  const counterpartyDecimals = counterpartyCw20
    ? counterpartyCw20.info.decimals
    : nativeTokenDecimals(counterparty.denomOrAddress) ?? 0
  const counterpartyMin = convertMicroDenomToDenomWithDecimals(
    1,
    counterpartyDecimals
  )
  const counterpartyMax = convertMicroDenomToDenomWithDecimals(
    counterpartyCw20
      ? counterpartyCw20.balance
      : (counterpartyNativeBalances.loading
          ? undefined
          : counterpartyNativeBalances.data.find(
              ({ denom }) => counterparty.denomOrAddress === denom
            )?.amount) ?? 0,
    counterpartyDecimals
  )
  const counterpartySymbol =
    counterpartyCw20?.info.symbol ??
    nativeTokenLabel(counterparty.denomOrAddress)

  const counterpartyAddressValid =
    !!counterparty.address &&
    isValidAddress(counterparty.address, CHAIN_BECH32_PREFIX)

  // Validate instantiation. Cleared in InstantiatedTokenSwap component.
  useEffect(() => {
    if (!errors?.instantiateData?._error) {
      setError(fieldNamePrefix + 'instantiateData._error', {
        type: 'custom',
        message: t('error.tokenSwapNeedsInstantiation'),
      })
    }
  }, [errors?.instantiateData?._error, fieldNamePrefix, setError, t])

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-prose">
        {t('form.tokenSwapInstantiateInstructions')}
      </p>

      <div className="space-y-2">
        <InputLabel name={t('form.whatSendCounterpartyQuestion')} />

        <div className="flex flex-row items-stretch gap-2">
          <NumberInput
            containerClassName="grow"
            error={errors?.instantiateData?.selfParty?.amount}
            fieldName={fieldNamePrefix + 'instantiateData.selfParty.amount'}
            max={selfMax}
            onMinus={() =>
              setValue(
                fieldNamePrefix + 'instantiateData.selfParty.amount',
                Math.max(selfParty.amount - 1, selfMin)
              )
            }
            onPlus={() =>
              setValue(
                fieldNamePrefix + 'instantiateData.selfParty.amount',
                Math.max(selfParty.amount + 1, selfMin)
              )
            }
            register={register}
            sizing="auto"
            step={selfMin}
            validation={[
              validateRequired,
              validatePositive,
              (value) =>
                value <= selfMax ||
                t('error.treasuryInsufficient', {
                  amount: selfMax.toLocaleString(undefined, {
                    maximumFractionDigits: selfDecimals,
                  }),
                  tokenSymbol: selfSymbol,
                }),
            ]}
          />

          <SelectInput
            error={errors?.instantiateData?.selfParty?.denomOrAddress}
            fieldName={
              fieldNamePrefix + 'instantiateData.selfParty.denomOrAddress'
            }
            onChange={(denomOrAddress) => {
              const foundCw20 = selfPartyCw20Balances.find(
                ({ address }) => counterparty.denomOrAddress === address
              )
              // Update type and decimals.
              setValue(
                fieldNamePrefix + 'instantiateData.selfParty.type',
                foundCw20 ? 'cw20' : 'native'
              )
              setValue(
                fieldNamePrefix + 'instantiateData.selfParty.decimals',
                foundCw20
                  ? foundCw20.info.decimals
                  : nativeTokenDecimals(denomOrAddress) ?? 0
              )
            }}
            register={register}
            style={{ maxWidth: '8.2rem' }}
          >
            {selfPartyNativeBalances.map(({ denom }) => (
              <option key={denom} value={denom}>
                ${nativeTokenLabel(denom)}
              </option>
            ))}
            {selfPartyCw20Balances.map(({ address, info: { symbol } }) => (
              <option key={address} value={address}>
                ${symbol}
              </option>
            ))}
          </SelectInput>
        </div>

        <InputErrorMessage error={errors?.instantiateData?.selfParty?.amount} />
        <InputErrorMessage
          error={errors?.instantiateData?.selfParty?.denomOrAddress}
        />
      </div>

      <div className="space-y-2">
        <InputLabel name={t('form.counterparty')} />

        <AddressInput
          error={errors?.instantiateData?.counterparty?.address}
          fieldName={fieldNamePrefix + 'instantiateData.counterparty.address'}
          register={register}
          rightNode={
            counterpartyAddressValid ? (
              <div className="pl-4">
                <ProfileDisplay address={counterparty.address} />
              </div>
            ) : undefined
          }
          validation={[validateRequired, validateAddress]}
        />

        <InputErrorMessage
          error={errors?.instantiateData?.counterparty?.address}
        />
      </div>

      {/* If address invalid, show nothing. */}
      {counterpartyAddressValid &&
        (counterpartyNativeBalances.loading ||
        counterpartyCw20Balances.loading ? (
          <Loader fill={false} size={32} />
        ) : (
          <>
            <div className="space-y-2">
              <InputLabel name={t('form.whatReceiveCounterpartyQuestion')} />

              <div className="flex flex-row items-stretch gap-2">
                <NumberInput
                  containerClassName="grow"
                  error={errors?.instantiateData?.counterparty?.amount}
                  fieldName={
                    fieldNamePrefix + 'instantiateData.counterparty.amount'
                  }
                  onMinus={() =>
                    setValue(
                      fieldNamePrefix + 'instantiateData.counterparty.amount',
                      Math.max(counterparty.amount - 1, counterpartyMin)
                    )
                  }
                  onPlus={() =>
                    setValue(
                      fieldNamePrefix + 'instantiateData.counterparty.amount',
                      Math.max(counterparty.amount + 1, counterpartyMin)
                    )
                  }
                  register={register}
                  sizing="auto"
                  step={counterpartyMin}
                  validation={[validateRequired, validatePositive]}
                />

                <SelectInput
                  error={errors?.instantiateData?.counterparty?.denomOrAddress}
                  fieldName={
                    fieldNamePrefix +
                    'instantiateData.counterparty.denomOrAddress'
                  }
                  onChange={(denomOrAddress) => {
                    const foundCw20 = counterpartyCw20Balances.data.find(
                      ({ address }) => counterparty.denomOrAddress === address
                    )
                    // Update type and decimals.
                    setValue(
                      fieldNamePrefix + 'instantiateData.counterparty.type',
                      foundCw20 ? 'cw20' : 'native'
                    )
                    setValue(
                      fieldNamePrefix + 'instantiateData.counterparty.decimals',
                      foundCw20
                        ? foundCw20.info.decimals
                        : nativeTokenDecimals(denomOrAddress) ?? 0
                    )
                  }}
                  register={register}
                  style={{ maxWidth: '8.2rem' }}
                >
                  {counterpartyNativeBalances.data.map(({ denom }) => (
                    <option key={denom} value={denom}>
                      ${nativeTokenLabel(denom)}
                    </option>
                  ))}
                  {counterpartyCw20Balances.data.map(
                    ({ address, info: { symbol } }) => (
                      <option key={address} value={address}>
                        ${symbol}
                      </option>
                    )
                  )}
                </SelectInput>
              </div>

              {/* Warn if counterparty does not have the requested amount. */}
              {counterparty.amount > counterpartyMax && (
                <p className="caption-text text-text-interactive-warning-body">
                  {t('error.counterpartyBalanceInsufficient', {
                    amount: counterpartyMax.toLocaleString(undefined, {
                      maximumFractionDigits: counterpartyDecimals,
                    }),
                    tokenSymbol: counterpartySymbol,
                  })}
                </p>
              )}

              <InputErrorMessage
                error={errors?.instantiateData?.counterparty?.amount}
              />
              <InputErrorMessage
                error={errors?.instantiateData?.counterparty?.denomOrAddress}
              />
            </div>
          </>
        ))}

      <div className="flex flex-col items-end space-y-2 self-end">
        <Button
          loading={instantiating}
          onClick={async () => {
            // Manually validate just the instantiation fields.
            const valid = await trigger(fieldNamePrefix + 'instantiateData')
            valid && onInstantiate()
          }}
          size="lg"
        >
          {t('button.instantiate')}
        </Button>

        <p className="caption-text text-right">
          {t('info.noFundsDuringInstantiation')}
        </p>

        <InputErrorMessage
          className="text-right"
          error={errors?.instantiateData?._error}
        />
      </div>
    </div>
  )
}
