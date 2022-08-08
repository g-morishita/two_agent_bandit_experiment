import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychSurveyHtmlForm from '@jspsych/plugin-survey-html-form';
import jsPsychPreload from '@jspsych/plugin-preload';
import jsPsychInstructions from '@jspsych/plugin-instructions';
import jsPsychCallFunction from '@jspsych/plugin-call-function';
import {StableBernoulliBandit} from './bandits.js'
import {unknown_config} from './config.js'
import "./style.css"
import {putS3, download} from "./helper";

const preprocess = (username, jsonData) => {
  let csvResult = "participant,session,chosenArm,reward,meanRewardChoice1,meanRewardChoice2\r\n"
  for (let trial of jsonData["trials"]) {
    if (trial.hasOwnProperty("session")) {
      csvResult += username + ',';
      csvResult += trial["session"] + ',';
      csvResult += trial["response"] + ',';
      csvResult += trial["reward"] + ',';
      csvResult += trial["meanRewardChoice1"] + ',';
      csvResult += trial["meanRewardChoice2"];
      csvResult += '\r\n';
    }
  }
  return csvResult;
};

const postProcess = () => {
  const username = jsPsych.data.get()["trials"][2].response.name
  const jsonFileName = username + Date.now() + '.json';
  const csvFileName = username + Date.now() + '.csv';
  const result = jsPsych.data.get();
  const csvResult = preprocess(username, result)
  download(jsonFileName, JSON.stringify(result));
  download(csvFileName, csvResult);
  putS3(JSON.stringify(result), jsonFileName);
  putS3(csvResult, csvFileName);
};

const jsPsych = initJsPsych();

const timeline = [];
const choiceImageCandidates = ['choice1.png', 'choice2.png', 'choice3.png', 'choice4.png', 'choice5.png', 'choice6.png', 'choice7.png', 'choice8.png', 'choice9.png', 'choice10.png'];

// Experiment setting randomly chosen.
const choiceImages = jsPsych.randomization.sampleWithoutReplacement(choiceImageCandidates, 6);
let unknownChoiceRewardProbs = [];
for (let i = 0; i < 3; i++) {
  if (i === 0) {
    unknownChoiceRewardProbs.push([0.8, 0.3]);
  } else {
    const unknownProb = jsPsych.randomization.sampleWithoutReplacement(unknown_config.unknownRewardCandidates, 1);
    const gap = jsPsych.randomization.sampleWithoutReplacement(unknown_config.gaps, 1);
    const unknownProbs = jsPsych.randomization.sampleWithoutReplacement([parseFloat(unknownProb), parseFloat(unknownProb) - parseFloat(gap)], 2)
    unknownChoiceRewardProbs.push(unknownProbs);
  }
}

// Preload the images.
const choiceImagesPath = [...Array(9).keys()].map(x => 'images/choice' + (x+1) + '.png');
const preload = {
  type: jsPsychPreload,
  auto_preload: true,
  images: choiceImagesPath.concat(["images/reward.png", "images/no_reward.png"]),
};
timeline.push(preload);

const instruction = {
  type: jsPsychInstructions,
  pages: [`
    <div style="margin: 10% 10%;">
    <h1 style="text-align: center;">SUBJECT INSTRUCTIONS</h1>
    <div>
        <p>Thank you for signing up for our pilot experiment.</p>
    </div>
    <div>
        <p>NOTE: It is VERY important that you understand the instructions, since your performance in the experiment will depend on your ability to make good decisions. Please ask if you have any questions.</p>
    </div>
    <div>
        <p>This experiment is broken down into 3 separate sessions and each session consists of a certain number of trials.
        The total trial number in each session are not necessarily the same.
        You have a practice session which is the first session, to give you a taste what this experiment looks like.
        In total, the experiment should take about 30 minutes.</p>
    </div>
    
    
    <div>
        Experiment outline:
        <ul>
            <li>1st session (Practice Session)</li>
            <li>2nd session</li>
            <li>3rd session</li>
        </ul>
    </div>
    <div>
    You do not need to bring any material to the experiment, and you are not allowed to take notes.
    In order to ensure a good performance, you should try to make the best possible choice on each individual trial.
    Detailed instructions are provided in the next page. 
    </div>
    </div>`,
  `
    <div style="margin: 10% 10%;">
        <h1 style="text-align: ">Pilot Experiment: Make choices on your own</h1>
        <div><p><b>Overview:</b> In this experiment, you will be given two choices with different fractal shapes repeatedly.
        In each trial, you choose one of the shapes by clicking the image, and you will know whether you win a reward or not.
        The goal is to obtain as many rewards as possible.</p></div>
        
        <div><p>
        Each of the two choices is associated with a different probability of winning.
        The reward probabilities will be fixed through the same session but, they are unknown.
        Hence, you should explore by yourself to know which choice is more rewarding and earn as much reward as possible.
        </p></div>
    
        <div><p>You have in total 30 minutes to complete two sessions, and you do not need to bring anything to the experiment.</p></div>
        
        <h3>How do you make your choice?</h3>
        <div><p>First, you will be asked to type your name. Press "Continue" to enter the experiment. </p></div>
        
        <div><p>
          Then, you will be presented with two choices of different fractal images.
          Each image is assigned to an unknown reward probability and the probabilities are fixed in each session.
          Different images with different reward probabilities will be used in different sessions, so you have to explore each option in all sessions.
          Press any key again to start your experiment and then click on any image to make your choice.
        </p></div>
        
        <div "display: flex;"><img style="width: 30%; margin-left: 15%; margin-right: 15%;" src='images/choice3.png' /><img style="width: 30%;" src='images/choice10.png' /></div>

        <div><p>After you made your choice, you will immediately know whether you received a reward or not. You will see an image like this to indicate that you won a reward</p></div>
        <div style="text-align: center;"><img style="width: 40%;" src="images/reward.png"></div>
        <div><p>Similarly, if you didn't win a reward, you will see this image:</p></div>
        <div style="text-align: center;"><img style="width: 40%;" src="images/no_reward.png"></div>
              <div><p><b>Note:</b></p></div>
      <ol>
        <li>You do not need to bring any material to the experiment and, you are not required to record your choice.</li>
        <li>You will have a practice session as your 1st session + 2 sessions. The practice session is for you to have a taste of the experiment hence the trial number and the reward probabilities are not indicative of the true experiment. </li>
        <li>The probabilities of the unknown options in session 1, 2 and 3 are not the same. Hence, you should explore in every session. </li>
        <li>You will repeatedly choose between two images for a certain number of trials. You should keep track of the probabilities over the session to maximise your total reward.</li>
        <li>You have around 30 minutes to complete two sessions. Hence, please finish all trials in 30 minutes and allocate your time wisely.</li>
      </ol>
      <div style="font-size: 28px;">If you click next, you will move on to the practice session. <b>You cannot get back to the instruction page during the session</b>. Please make sure you understand the instruction before clicking next.</b></div>
    </div>`,
  ],
  show_clickable_nav: true
}
timeline.push(instruction);

// Ask the username.
const askName = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<p>Please enter your name (which does not have to be your real name):</p>',
  html: '<p><input name="name" type="text" /></p>'
};
timeline.push(askName);

const newSession = {
    type: htmlKeyboardResponse,
    stimulus: `<div style="text-align: center;"><h1>Press any key to start a session.</h1>`
};

const createTrial = (currentSession, unknownChoiceRewardProbs, choiceImages) => {
  const bandit = new StableBernoulliBandit(unknownChoiceRewardProbs[currentSession]);
  const images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1));
  return {
    type: htmlButtonResponse,
      stimulus: '',
      choices: images,
      button_html: `<img style="cursor: pointer;" src='images/%choice%' />`,
      on_finish: (data) => {
        data.session = currentSession;
        data.meanRewardChoice1 = bandit.meanRewards[0];
        data.meanRewardChoice2 = bandit.meanRewards[1];
        data.reward = bandit.getReward(data.response);
    }
  };
};

const endTrial = (currentSession) => {
  let html = "";
  if (currentSession === 0) {
    html += `<div style="text-align: center; font-size: 35px;">This is the end of the practice session. Wait for 3 seconds.</div>`
  } else if (currentSession === 1) {
    html += `<div style="text-align: center; font-size: 35px;">This is the end of session ${currentSession}. Wait for 3 seconds.</div>`
  } else {
    html += `<div style="text-align: center; font-size: 35px;">This is the end of the experiment. Thank you for participating in our experiment.</div>`
  }
  return {
    type: htmlKeyboardResponse,
    stimulus: html,
    trial_duration: 3000,
    response_ends_trial: false
  };
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
    return html;
  },
  trial_duration: 2000, // ms
  response_ends_trial: false // Prevent participants from skipping the page.
};

for (let currentSession = 0; currentSession < 3; currentSession++) {
  timeline.push(newSession);

  const trial = createTrial(currentSession, unknownChoiceRewardProbs, choiceImages);

  let session;
  if (currentSession === 0) { // practice session
    session = {
      timeline: [trial, result],
      repetitions: unknown_config.practiceTimeHorizon
    };
  } else {
    session = {
      timeline: [trial, result],
      repetitions: unknown_config.timeHorizon
    };
  }

  timeline.push(session);
  const endSession = endTrial(currentSession);
  timeline.push(endSession);
}

const postProcessTrial = {
  type: jsPsychCallFunction,
  func: postProcess
};
timeline.push(postProcessTrial);

jsPsych.run(timeline);