export class QLearner {
  constructor(alpha, beta, numArms) {
    this._alpha = alpha;
    this._beta = beta;
    this._qValues = Array(numArms).fill(0);
  }

  get alpha() {
    return this._alpha;
  }
  set alpha(newAlpha) {
    if ((0 >= newAlpha) && (newAlpha >= 1)) {
      throw `alpha must be between 0 and 1. Given ${newAlpha}`;
    }
    this._alpha = newAlpha;
  }

  set beta(newBeta) {
    if (newBeta < 0) {
      throw `beta must be nonnegative. Given ${newBeta}`;
    }
    this._beta = newBeta;
  }
  get beta() {
    return this._beta;
  }

  set qValues(newQValues) {
    throw `You cannot change the number of arms.`;
  }
  get qValues() {
    return this._qValues;
  }

  takeAction() {
    const sum = this._qValues.reduce((prevVal, currVal) => prevVal + currVal, 0);
    const choiceProbs = this._qValues.map((qVal) => qVal / sum);
    return choiceProbs;
  }
}
