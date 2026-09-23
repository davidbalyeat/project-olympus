/* Project Olympus configuration.
   syncUrl: paste the Google Apps Script Web app URL (ends in /exec) between the quotes to turn on cloud save.
   Leave it empty ('') to run in local-only mode (progress stays in this browser; use the progress file to move it). */
window.OLY = window.OLY || {};
OLY.config = {
  /* Profiles allowed to turn on Teacher mode (answer keys, badge awarding, printing,
     quest setup). Everyone else never sees the button. Add a name here to grant it. */
  grownups: ['David', 'John'],
  syncUrl: 'https://script.google.com/macros/s/AKfycbwuHbnhGDDmN3hEV037O1gN5XfIuqjjZ2LoCYdbkuEuwKICIWvvMAl4BgDotmrIKfA1/exec'
};
