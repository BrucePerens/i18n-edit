module I18n
  module Edit
    module ApplicationHelper
      def i18n_edit_assets
        if ENV['I18N_EDIT'].nil?
          return ''
        else
          return javascript_include_tag('i18n/edit/application.js') + \
           stylesheet_link_tag('i18n/edit/i18n_edit.css')
        end
      end
    end
  end
end
