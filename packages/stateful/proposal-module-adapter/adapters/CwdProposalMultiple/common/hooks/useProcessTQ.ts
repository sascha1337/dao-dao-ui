import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ProcessedTQ,
  ProcessedTQType,
  ProcessedThresholdQuorum,
} from '@dao-dao/types'
import { VotingStrategy } from '@dao-dao/types/contracts/CwdProposalMultiple'
import { formatPercentOf100 } from '@dao-dao/utils'

export const useProcessTQ = () => {
  const { t } = useTranslation()

  return useCallback(
    (data: VotingStrategy): ProcessedThresholdQuorum => {
      if (!('single_choice' in data)) {
        console.error('unrecognized voting_strategy')
      }

      //! Threshold
      // Multiple choice does not have thresholds
      let threshold: undefined
      //! Quorum
      let quorum: ProcessedTQ
      const quorumSource = data.single_choice.quorum

      if ('majority' in quorumSource) {
        quorum = {
          type: ProcessedTQType.Majority,
          display: t('info.majority'),
        }
      } else {
        const percent = Number(quorumSource.percent) * 100
        quorum = {
          type: ProcessedTQType.Percent,
          value: percent,
          display: formatPercentOf100(percent),
        }
      }

      return {
        threshold,
        quorum,
      }
    },
    [t]
  )
}
