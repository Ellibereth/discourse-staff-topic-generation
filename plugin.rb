# name: email-topic-generation
# about: Create topic and invite users with a button click
# version: 0.1
# authors: Jordan Seanor
# url: https://github.com/HMSAB/discourse-email-generation.git

enabled_site_setting :email_topic_generation_enabled

register_asset("stylesheets/staffmail.scss", :desktop)

after_initialize do
  load File.expand_path("../controllers/staffmail_controller.rb", __FILE__)

  Discourse::Application.routes.prepend do
    post 'staffmail/check_or_create_user' => 'staffmail#check_or_create_user'
    post 'staffmail/add_user_to_topic_no_email' => 'staffmail#add_user_to_topic'
  end
end
