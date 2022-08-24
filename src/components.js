// Ask the username.
import jsPsychSurveyHtmlForm from "@jspsych/plugin-survey-html-form";

export const askName = {
    type: jsPsychSurveyHtmlForm,
    preamble: '<p>Please enter your name (which does not have to be your real name):</p>',
    html: '<p><input name="name" type="text" /></p>'
};