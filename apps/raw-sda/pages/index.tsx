import { useWallet } from '@noahsaso/cosmodal'
import type { NextPage } from 'next'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConnectWalletButton, StakingModal } from '@dao-dao/common'
import { Pie } from '@dao-dao/icons'
import { useGovernanceTokenInfo } from '@dao-dao/state'
import { StakingMode, SuspenseLoader, TooltipIcon } from '@dao-dao/ui'

import {
  BalanceCardLoader,
  ClaimsList,
  Loader,
  PageWrapper,
  PageWrapperProps,
  StakeHeader,
  StakeHeaderLoader,
  StakedBalanceCard,
  UnstakedBalanceCard,
} from '@/components'
import { makeGetStaticProps } from '@/server/makeGetStaticProps'
import { DAO_ADDRESS } from '@/util'

const InnerStake = () => {
  const { t } = useTranslation()
  const { connected } = useWallet()
  const { governanceTokenInfo } = useGovernanceTokenInfo(DAO_ADDRESS)

  // Set to default mode to display, and undefined to hide.
  const [showStakingMode, setShowStakingMode] = useState<StakingMode>()

  if (!governanceTokenInfo) {
    throw new Error('Failed to load page data.')
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex relative flex-col items-center mt-16 bg-primary rounded-b-lg border-t border-inactive lg:mt-32">
          <SuspenseLoader fallback={<StakeHeaderLoader />}>
            <StakeHeader />
          </SuspenseLoader>
        </div>

        <div className="flex flex-row gap-2 items-center text-lg title-text">
          <Pie color="rgb(var(--dark))" height={22} width={22} />
          <p>{t('title.yourTokens')}</p>
        </div>

        {connected ? (
          <>
            <div className="flex flex-col gap-4 justify-start items-stretch !mt-4 lg:flex-row">
              <div className="flex-1 p-6 rounded-lg border border-default">
                <p className="mb-2 font-mono text-sm text-tertiary">
                  {t('title.balanceUnstaked', {
                    name: governanceTokenInfo.name,
                  })}
                </p>

                <SuspenseLoader fallback={<BalanceCardLoader />}>
                  <UnstakedBalanceCard
                    setShowStakingMode={() =>
                      setShowStakingMode(StakingMode.Stake)
                    }
                  />
                </SuspenseLoader>
              </div>

              <div className="flex-1 p-6 rounded-lg border border-default">
                <p className="flex gap-2 mb-2 font-mono text-sm text-tertiary">
                  <span>
                    {t('title.votingPowerStakedAndRewards', {
                      name: governanceTokenInfo.name,
                    })}
                  </span>
                  <TooltipIcon
                    label={t('info.autoCompoundStakingRewardsTooltip')}
                  />
                </p>

                <SuspenseLoader fallback={<BalanceCardLoader />}>
                  <StakedBalanceCard
                    setShowStakingMode={() =>
                      setShowStakingMode(StakingMode.Unstake)
                    }
                  />
                </SuspenseLoader>
              </div>
            </div>

            <SuspenseLoader
              fallback={
                <>
                  <p className="text-lg title-text">
                    {t('title.unstakingNamedTokens', {
                      name: governanceTokenInfo.name,
                    })}
                  </p>
                  <Loader />
                </>
              }
            >
              <ClaimsList
                showClaim={() => setShowStakingMode(StakingMode.Claim)}
              />
            </SuspenseLoader>
          </>
        ) : (
          <ConnectWalletButton className="!w-auto" />
        )}
      </div>

      {showStakingMode !== undefined && (
        <StakingModal
          connectWalletButton={<ConnectWalletButton className="!w-auto" />}
          coreAddress={DAO_ADDRESS}
          loader={<Loader />}
          mode={showStakingMode}
          onClose={() => setShowStakingMode(undefined)}
        />
      )}
    </>
  )
}

const MembersOrStakePage: NextPage<PageWrapperProps> = ({
  children: _,
  ...props
}) => (
  <PageWrapper {...props}>
    <InnerStake />
  </PageWrapper>
)

export default MembersOrStakePage

export const getStaticProps = makeGetStaticProps()