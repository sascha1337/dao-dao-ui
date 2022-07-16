/* eslint-disable @next/next/no-img-element */

import { useTranslation } from 'react-i18next'
import { useRecoilValue } from 'recoil'

import { CwCoreSelectors } from '@dao-dao/state'
import { useVotingModuleAdapter } from '@dao-dao/voting-module-adapter/react'

import { DAO_ADDRESS, DEFAULT_IMAGE_URL } from '@/util'

import { Loader } from '../../Loader'
import { VoteHeroHeader } from './VoteHeroHeader'

export const VoteHeroContentLoader = () => {
  const {
    ui: { VoteHeroStats },
  } = useVotingModuleAdapter()

  return (
    <>
      <VoteHeroHeader image={<Loader size="100%" />} />
      <VoteHeroStats coreAddress={DAO_ADDRESS} loader />
    </>
  )
}

export const VoteHeroContent = () => {
  const { t } = useTranslation()

  const config = useRecoilValue(
    CwCoreSelectors.configSelector({ contractAddress: DAO_ADDRESS })
  )
  const {
    ui: { VoteHeroStats },
  } = useVotingModuleAdapter()

  if (!config) {
    throw new Error(t('error.loadingData'))
  }

  return (
    <>
      <VoteHeroHeader
        description={config.description}
        image={
          <img
            alt="logo"
            className="w-full h-full"
            src={config.image_url ?? DEFAULT_IMAGE_URL}
          />
        }
        title={config.name}
      />
      <VoteHeroStats coreAddress={DAO_ADDRESS} />
    </>
  )
}