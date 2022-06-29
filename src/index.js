import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychPreload from '@jspsych/plugin-preload';
import {QLearner} from './agents.js'
import {StableBernoulliBandit} from './bandits.js'
import {config} from './config.js'
import "./style.css"

const jsPsych = initJsPsych({
  on_finish: () => jsPsych.data.displayData() // for debugging
});
const timeline = [];
const choiceImageCandidates = ['choice1.png', 'choice2.png', 'choice3.png', 'choice4.png', 'choice5.png', 'choice6.png', 'choice7.png', 'choice8.png', 'choice9.png', 'choice10.png'];
const choiceImages = jsPsych.randomization.sampleWithoutReplacement(choiceImageCandidates, 2);
const knownChoiceImage = choiceImages[0];
const unknownChoiceImage = choiceImages[1];

// Randomly choose unknown reward
const unknownReward = jsPsych.randomization.sampleWithoutReplacement(config.unknownRewardCandidates, 1)[0];
const rewards = [config.knownReward, unknownReward];

const bandit = new StableBernoulliBandit(rewards);

// Instantiate an agent class.
const agent = new QLearner(
    config.agentAlpha,
    config.agentBeta,
    rewards.length
);

// Preload the images.
const choiceImagesPath = choiceImages.map(x => 'img/' + x);
const preload = {
  type: jsPsychPreload,
  auto_preload: true,
  images: choiceImagesPath.concat(["img/reward.png", "img/no_reward.png"]),
};
timeline.push(preload);

// Choice images order.
const choices = [{'choices': [choiceImages[0], choiceImages[1]]}, {'choices': [choiceImages[1], choiceImages[0]]}];
const choiceTimelineVariables = jsPsych.randomization.repeat(choices, config.timeHorizon)

const welcome = {
  type: htmlKeyboardResponse,
  stimulus: `<h1>Welcome to the experiment. Press any key to begin.</h1>`
};
timeline.push(welcome);

const instructions = {
  type: htmlKeyboardResponse,
  stimulus: `
    <p>in this experiment, there are two choices with different shapes.
    In each trial, you choose one of them by clicking the image of the shape and know if you win or not.</p>
    <p>Each of these two choices have a different probability of winning. Hence, you should "explore" and know which choice is better.</p>
    <p><b>Note that the reward probabilities are fixed through the same session.</b></p>
    <p>Plus, the choice with the image shown on the right has the known probability of 0.5. The reward probability of the choice on the left is unknown.</p>
    <p>Also, there is another person who does the task with the same choices. You can see his/her result after each trial while the other also observe your own result. However, you will not receive the rewards the other obtains.</p>
    <div style='width: 900px; align-text: center;'>
    <div style='float: left;'><img style="width: 300px;" src='img/${knownChoiceImage}'><p><b>This choice has a reward probability of 0.5.</b></p></img></div>
    <div style='float: right;'><img style="width: 300px;" src='img/${unknownChoiceImage}'></img></div>
    </div>
  `,
  on_finish: (data) => {
    data.unknownReward = unknownReward;
    data.knownReward = config.knownReward;
    data.config = config;
  }
};
timeline.push(instructions);

const trial = {
  type: htmlButtonResponse,
  stimulus: '',
  choices: jsPsych.timelineVariable('choices'),
  button_html: `<img src='img/%choice%'></img>`,
  on_finish: (data) => {
    const chosenArm = parseInt(data.response);
    data.chosenImage = jsPsych.timelineVariable('choices')[chosenArm];
    data.isunknownArm = data.chosenImage === knownChoiceImage ? 0 : 1;
    data.reward = bandit.getReward(data.isunknownArm); // known arm index is 0.

    // Agent's trial
    const agentChosenArm = agent.takeAction();
    const agentReward = bandit.getReward(chosenArm);
    data.agentArm = agentChosenArm;
    data.agentReward = agentReward;

    // Agent's update based on your own experiment
    agent.updateQValues(agentChosenArm, agentReward);
  }
}

const ownResult = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const data =  jsPsych.data.get().last(1).values()[0];
    const reward = data["reward"];
    let html = '';
    if (reward === 1) {
      html += `<div style="width: 600px; text-align: center;"><img src="img/reward.png"></img></div>`
    } else {
      html += `<div style="width: 600px; text-align: center;"><img src="img/no_reward.png"></img></div>`
    }
    return html;
  }
};

// TODO: We need to modify it here.
const agentResult = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const data =  jsPsych.data.get().last(2).values()[0];
    const armColor = data["agentArm"] === 0 ? "red" : "blue";
    const reward = data["agentReward"];
    let html = `<p>The other chose <font color="${armColor}">${armColor}</font>.</p>`
    if (reward === 1) {
      html += `<div style="width: 600px; text-align: center;"><img src="img/reward.png"></img></div>`
    } else {
      html += `<div style="width: 600px; text-align: center;"><img src="img/no_reward.png"></img></div>`
    }
    return html;
  }
};

const test_procedure = {
  timeline: [trial, ownResult, agentResult],
  timeline_variables: choiceTimelineVariables,
};

timeline.push(test_procedure);

jsPsych.run(timeline);