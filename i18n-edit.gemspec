$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "i18n/edit/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "i18n-edit"
  s.version     = I18n::Edit::VERSION
  s.authors     = ["Bruce Perens"]
  s.email       = ["bruce@perens.com"]
  s.homepage    = "http://perens.com/i18n-edit/"
  s.summary     = "In-place editor of internationalized text (locale data)."
  s.description = "Take the hassle out of managing internationized text! " \
                  "This in-place editor allows you to click on the text where it " \
                  "appears in your view in a live application, and edit it right " \
                  "there. No need to know the translation key, no multiple windows."
  s.license     = "AGPL-3.0"

  s.files = Dir[
    'Gemfile',
    'Rakefile',
    'app/controllers/i18n/edit/application_controller.rb',
    'app/controllers/i18n/edit/edit_controller.rb',
    'app/assets/javascripts/i18n/edit/application.js',
    'app/assets/javascripts/i18n/edit/i18n_edit.js',
    'app/assets/stylesheets/i18n/edit/i18n_edit.scss',
    'app/helpers/i18n/edit/application_helper.rb',
    'app/views/i18n/edit/edit/menu.html.slim',
    'config/routes.rb',
    'config/initializers/i18n_edit.rb',
    'config/initializers/action_controller.rb',
    'config/initializers/action_dispatch.rb',
    'config/initializers/i18n_backend_base.rb',
    'config/initializers/assets.rb',
    'lib/i18n/edit.rb',
    'lib/i18n/edit/version.rb',
    'lib/i18n/edit/engine.rb',
    'i18n-edit.gemspec',
    'README.md',
    'SIMPLE_TESTING_GRANT.txt',
    'AFFERO_GPL3.txt',
  ]

   s.add_runtime_dependency 'sysrandom', '~> 1'

   # Dependency on a semantic version is too coarse to work well with something as large
   # as rails.
   s.add_runtime_dependency 'rails', '> 3'
   s.add_runtime_dependency 'slim', '~> 3'
end
