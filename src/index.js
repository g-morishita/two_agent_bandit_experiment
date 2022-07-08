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
  xhr.open('POST', '/write_data');
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
    console.log(jsPsych.data.get());
    const filename = jsPsych.data.get()["trials"][1].response.name + Date.now() + '.json'
    download(filename, JSON.stringify(jsPsych.data.get()));
}});

const timeline = [];
const choiceImageCandidates = ['choice1.png', 'choice2.png', 'choice3.png', 'choice4.png', 'choice5.png', 'choice6.png', 'choice7.png', 'choice8.png', 'choice9.png', 'choice10.png'];

// Experiment setting randomly chosen.
const choiceImages = jsPsych.randomization.sampleWithoutReplacement(choiceImageCandidates, 6);
const knownChoicePositions = jsPsych.randomization.sampleWithReplacement([0, 1], 3); // 1 practice session and 2 sessions
const unknownChoiceRewardProbs = jsPsych.randomization.sampleWithoutReplacement(config.unknownRewardCandidates, 1);
unknownChoiceRewardProbs.concat(jsPsych.randomization.sampleWithoutReplacement(config.unknownRewardCandidates, 2));

// Preload the images.
const choiceImagesPath = choiceImages.map(x => 'images/' + x);
const preload = {
  type: jsPsychPreload,
  auto_preload: true,
  images: choiceImagesPath.concat(["images/reward.png", "images/no_reward.png"]),
};
timeline.push(preload);

// Ask the username.
const askName = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<p>Welcome to the experiment. Please enter your name (which does not have to be your real name):</p>',
  html: '<p><input name="name" type="text" /></p>'
};
timeline.push(askName);

const instructions = {
  type: htmlKeyboardResponse,
  stimulus: `
    <p>in this experiment, there are two choices with different shapes.
    In each trial, you choose one of them by clicking the image of the shape and know if you win or not.</p>
    <p>Each of these two choices have a different probability of winning. Hence, you should "explore" and know which choice is better.</p>
  `,
  on_finish: (data) => {
    data.randomizedKnownPositions = knownChoicePositions;
    data.unknownChoiceRewardProbs = unknownChoiceRewardProbs;
    data.config = config;
  }
};
timeline.push(instructions);

const chooseChoiceImages = (currentSession, choiceImages) => {
  const knownChoiceImage = choiceImages[currentSession];
  const unknownChoiceImage = choiceImages[currentSession + 1];
  let sessionChoiceImages = ["", ""];
  sessionChoiceImages[knownChoicePositions[currentSession]] = knownChoiceImage;
  sessionChoiceImages[1 - knownChoicePositions[currentSession]] = unknownChoiceImage;
  return [knownChoiceImage, unknownChoiceImage, sessionChoiceImages];
}

const CreateNewSessionInstruction = (currentSession, knownChoiceImage, unknownChoiceImage, knownChoicePositions) => {
  return {
    type: htmlKeyboardResponse,
    stimulus: () => {
      let html = `<div style="margin-left: 20%; width: 50%; height: 50%; display: flex;">`
      if (knownChoicePositions[currentSession] === 0) {
        html += `<div style="margin-right: 50px;"><img src='images/${knownChoiceImage}'>`;
        html += "<p style='font-size: 20px;'><b>The reward probability is fixed and 0.6.</b></p></div>";
        html += `<div><img src='images/${unknownChoiceImage}'></div>`;
      } else {
        html += `<div style="margin-right: 50px;"><img src='images/${unknownChoiceImage}'></div>`;
        html += `<div><img src='images/${knownChoiceImage}'>`;
        html += `<p style="font-size: 20px;"><b>The reward probability is fixed and ${config.knownReward}.</b></p></div>`;
      }
      html += "</div>"
      html += "<div style='text-align: center'>Press any key to start a session.</div>"
      return html;
    }
  }
};

const createBanditTask = (currentSession, knownChoicePositions, unknownChoiceRewardProbs) => {
  let rewardProbs = [0, 0];
  rewardProbs[knownChoicePositions[currentSession]] = config.knownReward;
  rewardProbs[1 - knownChoicePositions[currentSession]] = unknownChoiceRewardProbs[currentSession];
  return new StableBernoulliBandit(rewardProbs);
};

const createTrial = (currentSession, knownChoicePositions, choiceImages) => {
  return {
    type: htmlButtonResponse,
      stimulus: '',
      choices: choiceImages,
      button_html: `<img style="width: 300px;" src='images/%choice%'></img>`,
      on_finish: (data) => {
        data.session = currentSession;
        data.IsKnownChoice = Number(data.response === knownChoicePositions[currentSession]);
        data.reward = practiceBandit.getReward(data.chosenArm);
    }
  };
};

const endTrial = (currentSession) => {
  let html = "";
  if (currentSession === 0) {
    html += `<div style="text-align: center; font-size: 35px;">The practice session is over. Press any key to move on to the trial.</div>`
  } else if (currentSession == 1) {
    html += `<div style="text-align: center; font-size: 35px;">The session ${currentSession}. Press any key to move on to the trial.</div>`
  } else {
    html += `<div style="text-align: center; font-size: 35px;">All the sessions are over. Thank you for participating in our experiment.</div>`
  }
  return {
    type: htmlKeyboardResponse,
    stimulus: html
  }
}

const result = {
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
    html += "<p><b>Automatically move on to the next trial in 2 seconds.</b></p>"
    return html;
  },
  trial_duration: 2000, // ms
  response_ends_trial: false // Prevent participants from skipping the page.
};

// Practice Session
let currentSession = 0
const practiceBandit = createBanditTask(currentSession, knownChoicePositions, unknownChoiceRewardProbs);
const [practiceKnownChoiceImage, practiceUnknownChoiceImage, practiceChoiceImages] = chooseChoiceImages(currentSession, choiceImages);

const newSessionInstruction = CreateNewSessionInstruction(currentSession, practiceKnownChoiceImage, practiceUnknownChoiceImage, knownChoicePositions);
timeline.push(newSessionInstruction);

const practiceTrial = createTrial(currentSession, knownChoicePositions, practiceChoiceImages);

const practiceProcedure = {
  timeline: [practiceTrial, result],
  repetitions: config.practiceTimeHorizon
};
timeline.push(practiceProcedure);

const practiceEndTrial = endTrial(currentSession);
timeline.push(practiceEndTrial);

// Session 1
currentSession++;
const firstSessionBandit = createBanditTask(currentSession, knownChoicePositions, unknownChoiceRewardProbs);
const [firstSessionKnownChoiceImage, firstSessionUnknownChoiceImage, firstSessionChoiceImages] = chooseChoiceImages(currentSession, choiceImages);

const firstSessionInstruction = CreateNewSessionInstruction(currentSession, firstSessionKnownChoiceImage, firstSessionUnknownChoiceImage, knownChoicePositions);
timeline.push(firstSessionInstruction);

const firstSessionTrial = createTrial(currentSession, knownChoicePositions, firstSessionChoiceImages);
const firstSessionProcedure = {
  timeline: [firstSessionTrial, result],
  repetitions: config.timeHorizon
};

timeline.push(firstSessionProcedure);

const firstSessionEndTrial = endTrial(currentSession);
timeline.push(firstSessionEndTrial);

// Session 2
currentSession++;
const secondSessionBandit = createBanditTask(currentSession, knownChoicePositions, unknownChoiceRewardProbs);
const [secondSessionKnownChoiceImage, secondSessionUnknownChoiceImage, secondSessionChoiceImages] = chooseChoiceImages(currentSession, choiceImages);

const secondSessionInstruction = CreateNewSessionInstruction(currentSession, secondSessionKnownChoiceImage, secondSessionUnknownChoiceImage, knownChoicePositions);
timeline.push(secondSessionInstruction);

const secondSessionTrial = createTrial(currentSession, knownChoicePositions, secondSessionChoiceImages);
const secondSessionProcedure = {
  timeline: [secondSessionTrial, result],
  repetitions: config.timeHorizon
};

timeline.push(secondSessionProcedure);

const secondSessionEndTrial = endTrial(currentSession);
timeline.push(secondSessionEndTrial);

jsPsych.run(timeline);