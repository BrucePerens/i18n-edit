require 'i18n/edit/engine'
require 'sysrandom'

module I18n
  module Edit
    Token = ::Sysrandom.random_number(1<<63).to_s(36)
  end
end
