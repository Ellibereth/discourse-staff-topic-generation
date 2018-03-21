require_dependency 'email/sender'
require_dependency 'sidekiq'
require_relative 'staff_email_mailer'

module StaffEmailing
  class StaffEmail
    include Sidekiq::Worker

    sidekiq_options queue: 'critical'

    def execute(args)
      template = args[:template]
      to_address = args[:to_address]
      first_name = args[:first_name]
      message_body = args[:message_body]
      staff_username = args[:staff_username]

      message = StaffEmailMailer.send_email(template, first_name, to_address, staff_username, message_body)
      Email::Sender.new(message, :staff_email_mailer).send
    end
  end
end
