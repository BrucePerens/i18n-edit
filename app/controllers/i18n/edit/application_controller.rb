module I18n
  module Edit
    class ApplicationController < ActionController::Base
      protect_from_forgery with: :exception
    end
  end
end
