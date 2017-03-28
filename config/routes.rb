I18n::Edit::Engine.routes.draw do
  post '/i18n_edit/update' => 'edit#update'
  post '/i18n_edit/check_token' => 'edit#check_token'
  post '/i18n_edit/menu' => 'edit#menu'
  post '/i18n_edit/enable' => 'edit#enable'
  get '/i18n_edit/enable' => 'edit#enable'
end
