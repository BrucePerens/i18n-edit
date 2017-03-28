# Wrap a span around every translated text, which provides a handle for my editor.
# This will put spans in attributes of HTML nodes where they aren't valid. My
# javascript then comes along and removes those, placing a span around the node that
# contains them instead.
module ::I18n::Backend::Base
  alias_method :orig_translate, :translate
  def translate(language, key, options)
    value = orig_translate(language, key, options)
    if ENV['I18N_EDIT']
      return "<span class=i18n_edit contenteditable=true data-token=#{::I18n::Edit::Token} id=#{key.to_s}>#{value}</span>".html_safe
    else
      return value
    end
  end
end
