export const config = {
  agentAlpha: 0.1,
  agentBeta: 2,
  knownReward: 0.4,
  unknownRewardCandidates: [0.7, 0.5],
  timeHorizon: 70,
  practiceTimeHorizon: 30
}

export const unknown_config = {
  agentAlpha: 0.1,
  agentBeta: 2,
  unknownRewardCandidates: [0.7, 0.5, 0.3, 0.8],
  timeHorizon: 3,
  practiceTimeHorizon: 3
}