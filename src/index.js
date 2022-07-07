import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychSurveyHtmlForm from '@jspsych/plugin-survey-html-form';
import jsPsychPreload from '@jspsych/plugin-preload';
import {QLearner} from './agents.js'
import {StableBernoulliBandit} from './bandits.js'
import {config} from './config.js'
import "./style.css"

const saveData = (data) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/write_data'); // 'write_data.php' is the path to the php file described above.
  xhr.setRequestHeader('Content-Type', 'application/json');
  // xhr.send(JSON.stringify({test: "test"}));
  xhr.send(JSON.stringify({filedata: data}));
};

const download = (filename, text) => {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

const jsPsych = initJsPsych({
  on_finish: () => {jsPsych.data.displayData(); // for debugging
    saveData(jsPsych.data.get());
    download("result.json", JSON.stringify(jsPsych.data.get()));
}});

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
const choiceImagesPath = choiceImages.map(x => 'images/' + x);
const preload = {
  type: jsPsychPreload,
  auto_preload: true,
  images: choiceImagesPath.concat(["images/reward.png", "images/no_reward.png"]),
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
    <p>Plus, the choice with the image shown on the <b>left</b> has the known probability of <b>0.5</b>. The reward probability of the choice on the right is unknown.</p>
    <div style='width: 900px; height: 450px; text-align: center;'>
    <div style="width: 300px; float: left;"><img src='images/${knownChoiceImage}'><p><b>This choice has a reward probability of 0.5.</b></p></img></div>
    <div style='width: 300px; float: right;'><img src='images/${unknownChoiceImage}'></img></div>
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
  button_html: `<img style="width: 300px;" src='images/%choice%'></img>`,
  on_finish: (data) => {
    const chosenArm = parseInt(data.response);
    data.chosenImage = jsPsych.timelineVariable('choices')[chosenArm];
    data.isunknownArm = data.chosenImage === knownChoiceImage ? 0 : 1;
    data.reward = bandit.getReward(data.isunknownArm); // known arm index is 0.
  }
}

const ownResult = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const data =  jsPsych.data.get().last(1).values()[0];
    const reward = data["reward"];
    let html = '';
    if (reward === 1) {
      html += `<img style="width: 400px;" src="images/reward.png"></img>`
    } else {
      html += `<img style="width: 400px;" src="images/no_reward.png"></img>`
    }
    html += "<p><b>Press any key to move on the next trial</b></p>"
    return html;
  }
};

const test_procedure = {
  timeline: [trial, ownResult],
  timeline_variables: choiceTimelineVariables,
};

timeline.push(test_procedure);

const askName = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<p>Your name (which does not have to be your real name) is:</p>',
  html: '<p><input name="name" type="text" /></p>'
};

timeline.push(askName);

jsPsych.run(timeline);