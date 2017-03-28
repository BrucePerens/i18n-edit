module I18n
  module Edit
    class Engine < ::Rails::Engine
      isolate_namespace I18n::Edit
    end
  end
end
