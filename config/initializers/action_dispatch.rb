module ActionDispatch::Routing
  class Mapper
    def i18n_edit_routes
      mount I18n::Edit::Engine => '/'
    end
  end
end

