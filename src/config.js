export const config = {
  agentAlpha: 0.092,
  agentHighBeta: 43.91,
  agentLowBeta: 8.67,
  knownReward: 0.4,
  unknownRewardCandidates: [0.7, 0.5],
  timeHorizon: 70,
  practiceTimeHorizon: 30
}

export const unknown_config = {
  agentAlpha: 0.1,
  agentBeta: 2,
  unknownRewardCandidates: [0.7],
  gaps: [0.2],
  timeHorizon: 70,
  practiceTimeHorizon: 1
}