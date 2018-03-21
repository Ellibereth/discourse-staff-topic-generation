require_dependency 'email/message_builder'

class StaffEmailMailer < ActionMailer::Base
  include Email::BuildEmailHelper

  def send_email(template, first_name, to_address, staff_username, message_body)
    build_email(
      to_address,
      template: template,
      first_name: first_name,
      team_member: staff_username,
      email_body: message_body
    )
  end
end
