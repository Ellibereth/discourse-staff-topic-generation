import {withPluginApi} from 'discourse/lib/plugin-api';
import AppController from 'discourse/controllers/application';
import showModal from 'discourse/lib/show-modal';
import sweetalert from '../lib/sweetalert2/dist/sweetalert2'
import { ajax } from 'discourse/lib/ajax';


export default {
  name: 'staff-email-generation',
  initialize(container) {
    withPluginApi('0.8', api => {
        api.decorateWidget('header-icons:before', function(helper) {
          const currentUser = api.getCurrentUser();
          const headerState = helper.widget.parentWidget.state;
          let contents = [];
          if (currentUser && currentUser.staff) {
            const unread = currentUser.get('unread_private_messages');
            contents.push(helper.attach('header-dropdown', {
              title: 'user.private_messages',
              icon: 'paper-plane',
              iconId: 'toggle-messages-menu',
              active: headerState.messagesVisible,
              action: 'staffEmail'
            }));
          }
          if (headerState.messagesVisible) {
            contents.push(helper.attach('messages-menu'));
          }
          return contents;
        });

        /*
          I opted to use sweetalert2 to make a pretty popup for this. Was easy enough
          to implement and worked pretty well. 
        */
        api.attachWidgetAction('header', 'staffEmail', function() {
          var model = this;
          sweetalert({
            title: Discourse.SiteSettings.email_topic_generation_button_label,
            html:
              `<label class="staff-email-label" for="staff-email-first-name">First Name</label>
              <input id="staff-email-first-name" class="swal2-input">
              <label class="staff-email-label" for="staff-email-address">Email</label>
              <input id="staff-email-address" class="swal2-input">
              <label class="staff-email-label" for="staff-email-body">Message</label>
              <textarea id="staff-email-body" class="swal2-textarea">`,
            backdrop: `
              rgba(105,104,104,.5)
            `,
            focusConfirm: false,
            preConfirm: function () {
              var validInput = true;
              if($('#staff-email-first-name').val() === null || $('#staff-email-first-name').val() === ''){
                sweetalert.showValidationError('You must enter a first name.');
                validInput = false;
              }

              if($('#staff-email-address').val() === null || $('#staff-email-address').val() === '' ||
                !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($('#staff-email-address').val())){
                sweetalert.showValidationError('You must enter a valid email address.');
                validInput = false;
              }

              if($('#staff-email-body').val() === null || $('#staff-email-body').val() === ''){
                sweetalert.showValidationError('You must enter an email body.');
                validInput = false;
              }

              if(validInput){
                return new Promise(function (resolve) {
                  resolve([
                    $('#staff-email-first-name').val(),
                    $('#staff-email-address').val(),
                    $('#staff-email-body').val()
                  ])
                })
              }
            }
          }).then(function (result) {
            return ajax("/staffmail/send_notification", {
                dataType: 'json',
                data: { first_name: result.value[0],
                        to_address: result.value[1],
                        message_body: result.value[2],
                        staff_username: "jose"},
                type: 'POST',
                error: () => {
                  //TODO: Handle errors
                }
              }).then(function (response) {
                //TODO: Display success
              }).catch();
          }).catch(sweetalert.noop)
        });
      });
    }
  }
