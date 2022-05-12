import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import imageKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
import preload from '@jspsych/plugin-preload';

const jsPsych = initJsPsych({
  on_finish: () => jsPsych.data.displayData()
});

const timeline = [];

const preloaded_media = {
  type: preload,
  images: ['dist/img/blue.png', 'dist/img/red.png']
};

const welcome = {
  type: htmlKeyboardResponse,
  stimulus: "<h1>Welcome to the experiment. Press any key to begin.</h1>"
};

timeline.push(welcome);

const instructions = {
    type: htmlKeyboardResponse,
    stimulus: `
      <p>In this experiment, a circle will appear in the center 
      of the screen.</p><p>If the circle is <strong>blue</strong>, 
      press the letter F on the keyboard as fast as you can.</p>
      <p>If the circle is <strong>orange</strong>, press the letter J 
      as fast as you can.</p>
      <div style='width: 700px;'>
      <div style='float: left;'><img src='img/blue.png'></img>
      <p class='small'><strong>Press the F key</strong></p></div>
      <div style='float: right;'><img src='img/orange.png'></img>
      <p class='small'><strong>Press the J key</strong></p></div>
      </div>
      <p>Press any key to begin.</p>
    `,
    post_trial_gap: 2000
};

timeline.push(instructions);

const test_stimuli = [
  { stimulus: "img/blue.png", correct_response: 'f' },
  { stimulus: "img/orange.png", correct_response: 'j' }
];

const test = {
  type: imageKeyboardResponse,
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: ['f', 'j'],
  data: {
    task: 'response',
    correct_response: jsPsych.timelineVariable('correct_response')
  },
  on_finish: (data) => {
    data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
  }
};

const fixation = {
  type: htmlKeyboardResponse,
  stimulus: '<div style="font-size: 60px;">+</div>',
  choices: 'NO_KEYS',
  trial_duration: 100, // () => jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0],
  data: {
    task: 'fixation'
  }
};

const test_procedure = {
  timeline: [fixation, test],
  timeline_variables: test_stimuli,
  randomize_order: true,
  repetitions: 2
};

timeline.push(test_procedure)

const debrief_block = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const trials = jsPsych.data.get().filter({task: 'response'});
    const correct_trials = trials.filter({correct: true});
    const accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    const rt = Math.round(correct_trials.select('rt').mean());

    return `<h1>You responded correctly on ${accuracy}% of the trials.</h1>
            <h1>Your average response time was ${rt}ms.</h1>
            <h1>Press any key to complete the experiment. Thank you!</h1>`;
  }
}

timeline.push(debrief_block);

// const blue_trial = {
//   type: imageKeyboardResponse,
//   stimulus: 'img/blue.png',
//   choices: ['f', 'j']
// };
// 
// 
// const red_trial = {
//   type: imageKeyboardResponse,
//   stimulus: 'img/orange.png',
//   choices: ['f', 'j']
// };
// 
// timeline.push(blue_trial, red_trial);

jsPsych.run(timeline);
