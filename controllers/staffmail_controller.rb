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
        username: ::StaffmailController.generate_random_user(),
        name: User.suggest_name(email_address),
        staged: true)
    end
    render json: {user: user}
  end

  def add_user_to_topic_no_email
    topic_id = params[:topic_id]
    user_id = params[:user_id]
    username = params[:user_username]
    private_message = ActiveModel::Type::Boolean.new.cast(params[:private_message])
    if !private_message
      topic = Topic.find_by(id: topic_id)
      topic.topic_allowed_users.create(user_id: user_id)
      TopicUser.auto_notification_for_staging(user_id, topic_id, TopicUser.notification_reasons[:auto_watch])
      topic.add_small_action(Discourse.system_user, "invited_user", username)
    end
    render json: {success: true}
  end

  #Generate a random username
def self.generate_random_user
  name = "anon" + 10.times.map{rand(10)}.join.to_s
  name
end
end
