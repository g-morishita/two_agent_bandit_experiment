export class QLearner {
  constructor(alpha, beta, numArms) {
    this.alpha = alpha;
    this.beta = beta;
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
    const cumDist = this.#calculateCumDistWithSoftmax();
    const randomVal = Math.random();
    for (let i = 0; i < cumDist.length; i++) {
      if (randomVal < cumDist[i]) {
        return i;
      }
    }
    return cumDist.length - 1;
  }

  #calculateCumDistWithSoftmax() {
    // const sum = this._qValues.reduce((prevVal, currVal) => prevVal + currVal, 0);
    const expQ = this._qValues.map((qVal) => Math.exp(this.beta * qVal));
    const sum = expQ.reduce((prevVal, currVal) => prevVal + currVal, 0);
    let cumSum = 0;
    const cumulativeDist = expQ.map((expQVal) => cumSum += expQVal / sum);
    return cumulativeDist;
  }

  updateQValues(chosenArm, reward) {
    if (chosenArm >= this.qValues.length) {
      throw `The index of the given arm exceeds. Given ${chosenArm}`;
    }
    this._qValues[chosenArm] += this._alpha * (reward - this._qValues[chosenArm]);
  }
}
