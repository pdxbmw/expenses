<template>
  <div class="entry">
    <div id="authorize-div" style="display: none">
      <span>Authorize access to Drive API</span>
      <button id="authorize-button" @click="handleAuthClick">Authorize</button>
    </div>    
    <section class="container-fluid">
      <h1>Enter an expense</h1>
      <form id="expense-form" enctype="multipart/form-data" @submit.prevent="onSubmit">
        <fieldset class="form-group" v-for="type in inputs">
          <label for="{{ $key }}">{{ toTitleCase($key) }}</label>   
          <select id="{{ $key }}" class="form-control" name="{{ toTitleCase($key) }}">
            <option selected disabled>Select a {{ $key }}...</option>
            <option v-for="item in type" v-bind:value="item.name">{{ item.name }}</option>
          </select>        
        </fieldset>
        <fieldset class="form-group">
          <label for="date">Date</label>
          <div class="input-group date" id="datepicker">
            <span class="input-group-addon"><span class="fa fa-calendar"></span></span>          
            <input id="date" name="Date" type="text" class="form-control" placeholder="MM-DD-YYYY">
          </div>
        </fieldset>
        <fieldset class="form-group">
          <label for="amount">Amount</label>
          <div class="input-group">
            <span class="input-group-addon"><span class="fa fa-usd"></span></span>          
            <input class="form-control" id="amount" name="Amount" type="number" step="0.01" placeholder="00.00">
          </div>
        </fieldset>                 
        <fieldset class="form-group">
          <label for="description">Description</label>
          <input class="form-control" id="description" name="Description" type="text" placeholder="Optional">
        </fieldset>
        <fieldset class="form-group">
          <label for="file">Upload a receipt</label>
          <label class="file">
            <input id="receipt" type="file" @change="onFileChange">
            <span class="file-custom" data-filename="Choose a file..."></span>
          </label>        
        </fieldset>            
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </section>
  </div>
</template>

<script>
  import { toTitleCase } from '../filters';
  import Google from '../lib/google.js';

  const _ = require('lodash');

  export default {
    data() {
      return {
        inputs: [],
      };
    },
    created() {
      window.console.log('created');
      this.handleGoogleAuth();
      this.fetchInputs();
    },
    ready() {
      const $ = window.$;

      $('#datepicker').datepicker({
        format: 'mm-dd-yyyy',
        todayHighlight: true,
        autoclose: true,
      });
    },
    methods: {
      toTitleCase,
      handleAuthClick() {
        Google.authInit();
      },
      handleGoogleAuth() {
        window.gapi.load('auth', Google.authInit);
      },
      fetchInputs() {
        this.$http.get(Google.SPREADSHEET_GET_URL).then((response) => {
          if (response.status === 200) {
            this.inputs = Google.handleSheetInputs(response.data);
          }
        });
      },
      onFileChange(event) {
        window.$('.file-custom').attr('data-filename', event.target.value);
      },
      onSubmit() {
        const $ = window.$;
        const data = $('#receipt')[0].files[0];

        if (!data) {
          this.submitForm();
          return;
        }

        data.fileName = [_.kebabCase($('#merchant').val()), $('#date').val()].join('--');
        Google.insertFile(data, this.submitForm);
      },
      submitForm(image) {
        const $ = window.$;
        const $form = $('#expense-form');
        const $inputs = $form.find('input, select, button, textarea');
        let data = $form.serialize();

        if (image) {
          data = `${data}&Receipt=${image.id}`;
        }

        // Let's disable the inputs for the duration of the XHR request.
        // Note: We disable elements after the form data has been serialized.
        // Disabled form elements will not be serialized.
        $inputs.prop('disabled', true);

        const request = this.$http({
          url: Google.SPREADSHEET_POST_URL,
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data,
        });

        function success(response) {
          window.console.log('Hooray, it worked!', response);
        }

        function error(response) {
          window.console.error(`The following error occurred: ${response}`);
        }

        request.then(success, error);
        request.then(() => $inputs.prop('disabled', false));
      },
    },
  };
</script>

<style scoped>
  .file { width: 100%; }
  .file-custom::after { content: attr(data-filename); }
</style>
