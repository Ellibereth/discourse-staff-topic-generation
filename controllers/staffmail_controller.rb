require_relative 'staff_email'
class ::StaffmailController < ::ApplicationController
  def send_notification
    begin
      to_address = params[:to_address]
      first_name = params[:first_name]
      message_body = params[:message_body]
      staff_username = params[:staff_username]
      StaffEmailing::StaffEmail.new.execute(template: 'staff_email_mailer', to_address: to_address, first_name: first_name, message_body: message_body, staff_username: staff_username)
      render json: {success: true}
    rescue Exception => e
      puts e.message
      puts e.inspect
      render json: {success: false}
    end
  end


  def check_or_create_user
    email_address = params[:email_address]
    user = User.find_by_email(email_address)
    if user.nil?
      user = User.create!(
        email: email_address,
        username: User.suggest_name(email_address),
        name: User.suggest_name(email_address),
        staged: true)
    end
    render json: {user: user}
  end
end
