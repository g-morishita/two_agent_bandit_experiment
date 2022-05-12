import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
// import imageKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
// import preload from '@jspsych/plugin-preload';

const jsPsych = initJsPsych({
  on_finish: () => jsPsych.data.displayData() // for debugging
});

const timeline = [];

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

const trial = {
  type: htmlButtonResponse,
  stimulus: "",
  choices: ["arm1", "arm2"]
}

timeline.push(trial)

jsPsych.run(timeline);
