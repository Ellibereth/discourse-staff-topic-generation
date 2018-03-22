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
          let subject = "", firstname = "", emailAddress = "", body = "", archetype = "", private_message = false;
          let user = null;
          sweetalert({
            title: Discourse.SiteSettings.email_topic_generation_button_label,
            html:
              `<label class="staff-email-label" for="staff-email-first-name">First Name</label>
              <input id="staff-email-first-name" class="swal2-input">
              <label class="staff-email-label" for="staff-email-address">Email</label>
              <input id="staff-email-address" class="swal2-input">
              <label class="staff-email-label" for="staff-email-subject">Subject</label>
              <input id="staff-email-subject" class="swal2-input">
              <label class="staff-email-label" for="staff-email-body">Message</label>
              <textarea id="staff-email-body" class="swal2-textarea"></textarea>
              <select style="width: 100%" class="swal2-select" id="staff-email-message-type">
                <option value="private_message">Private Message</option>
                <option value="regular">Public Topic</option>
              </select>`,
              backdrop: 'url("' + Discourse.SiteSettings.email_topic_generation_popup_background_image_link + '") center',
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

              if($('#staff-email-subject').val() === null || $('#staff-email-subject').val() === ''){
                sweetalert.showValidationError('You must enter an email subject.');
                validInput = false;
              }

              if(validInput){
                firstname = $('#staff-email-first-name').val();
                emailAddress = $('#staff-email-address').val();
                body = $('#staff-email-body').val();
                subject = $('#staff-email-subject').val();
                archetype = $('#staff-email-message-type').val();
                return new Promise(function (resolve) {
                  resolve(true)
                })
              }
            }
          }).then(function (result) {
            return ajax("/staffmail/check_or_create_user", {
              dataType: 'json',
              data: {email_address: emailAddress},
              type: 'POST'
            }).then((response) => {
              user = response.user;
              private_message = (archetype === "private_message") ? true : false;
              return ajax("/posts", {
                dataType: 'json',
                data: {
                  title: subject,
                  raw: body,
                  archetype: archetype,
                  target_usernames: user.username
                },
                type: 'POST'
              }).then((response) => {
                return ajax("staffmail/add_user_to_topic_no_email", {
                  dataType: 'json',
                  data: { user_id: user.id,
                          user_username: user.username,
                          topic_id: response.topic_id,
                          private_message: private_message },
                  type: 'POST'
                }).then((response) => {
                  return ajax("/staffmail/send_notification", {
                    dataType: 'json',
                    data: { first_name: firstname,
                            to_address: emailAddress,
                            message_body: body,
                            staff_username: Discourse.User.currentProp('username')},
                    type: 'POST'
                  }).then((response) => {
                    sweetalert({
                      width: 600,
                      timer: 1300,
                      background: '#FF814C',
                      html: '<h3>Message Sent</h3>' +
                      '<img src="https://thumbs.gfycat.com/OrangeUnluckyKingfisher-size_restricted.gif"></img>'
                      })
                  })
                })
              })
            });
          }).catch(sweetalert.noop)
        });
      });
    }
  }
