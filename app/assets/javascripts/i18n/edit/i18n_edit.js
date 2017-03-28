'use strict';

class I18n_Edit {
  constructor() {
    // Write the object being edited if the page is unloaded.
    window.addEventListener('beforeunload', this.call_method(this.event_beforeunload));

    // Remove the i18n_edit span from the document title.
    var match = document.title.match(this.span_pattern());
    if (match) {
      document.title = match[2];
    }
  
    // A span of class i18n_edit will be placed around each internationalized text
    // by the Rails code, to handle the editor events. Connect the event handlers.
    var list = document.getElementsByClassName('i18n_edit');
    Array.from(list).forEach(this.call_method(this.connect_editor_span));

    // The Rails code will place an i18n_edit span around each internationalized
    // attribute of an HTML node. But spans in attributes don't parse.
    // Handle_internationalized_attributes() removes the span from each internationalized
    // attribute and instead places a span around the node.
    list = document.getElementsByTagName('*')
    for (var i = 0; i < list.length; i++ ) {
      this.handle_internationalized_attributes(list, i);
    }

    // Tell the user that the editor is running.
    console.log("i18n_edit, by Bruce Perens <bruce@perens.com>");
  }

  // Return a function that calls the named method on this object, passing one argument.
  // Used to install class methods as event handlers, with a correct "this" pointer.
  call_method(func) {
    const object = this;
    return function(arg) { func.call(object, arg); }
  }

  // A span of class i18n_edit will be placed around each internationalized text
  // by the Rails code, to handle the editor events. Connect the event handlers.
  // If "dismiss" is true, right-click will dismiss the menu rather than create a new
  // one. This is used when connecting up the editable-text span in a context menu.
  connect_editor_span(e, dismiss = false) {
    var context_menu_function = dismiss ? this.event_contextmenu_dismiss : this.event_contextmenu;
    e.addEventListener('contextmenu', this.call_method(context_menu_function));
    e.addEventListener('focus', this.call_method(this.event_focus));
    e.addEventListener('focusout', this.call_method(this.event_focusout));
    e.addEventListener('input', this.call_method(this.event_input));
    // If the parent is a label and has a "for" attribute, remove it.
    // "for" tells the browser to send the focus to the companion input
    // when the label is clicked.
    // While editing the label text, the focus must remain on the label,
    // not be diverted to the input.
    e.parentElement.removeAttribute('for')
  }
  
  // When an editor menu is dismissed, this is called on each i18n_edit_menu_parent
  // node in the document (just one, unless one somehow got left around) and destroys
  // it.
  destroy_node(o) {
    o.parentElement.removeChild(o);
  }

  // An alert is triggered when an editable object is focused and the server isn't
  // running. When the alert is dismissed, the same object gets the focus back and
  // triggers the alert again, in a loop. To break the loop, remove focus from every
  // node in the document.
  do_blur() {
    window.blur();
    var list = document.getElementsByTagName('*')
    for (var i = 0; i < list.length; i++ ) {
      list[i].blur();
    }
  }
  
  // Command the Rails code to write the edited text.
  do_update() {
    var s = this.element
    var new_text = s.innerText;
  
    new_text = new_text.replace(/(\r\n)|(\\r\\n)|\r|\n|\\r|\\n/g, ' ');
    if (new_text != s.innerText) {
      s.innerText = new_text;
    }

    if (new_text == this.old_text) {
      return;
    }

    this.post_form('update', this.event_xhr_succeeded, function(f){
      f.append("key", s.id);
      f.append("text", new_text);
      f.append("old_text", this.old_text);
      f.append("token", this.token);
    });

    // Search all i18n_edit spans for id = the key, and update them.
    var list = document.querySelectorAll("[id='" + s.id + "']")
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if ( n.className == 'i18n_edit' ) {
        n.innerText = new_text;
      }
    }

    // Search for any i18n_edit_attributes span with attribute_name: key in its
    // data-i18n hash, and update the attribute.
    list = document.getElementsByClassName('i18n_edit_attributes');
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var i18n_string = n.getAttribute('data-i18n');
      if (i18n_string) {
        var i18n = JSON.parse(i18n_string);
        for (var key in i18n) {
          if (i18n[key] == s.id) {
            n.firstChild.setAttribute(key, new_text);
          }
        }
      }
    }

    this.element = null
    this.text = null
  }
  
  // If an edit was in progress and the page is being unloaded, write the edit.
  event_beforeunload(e) {
    if ( this.element ) {
      if ( this.element.innerText != this.old_text ) {
        this.do_update();
      }
    }
  }
  
  // Here is how to create a context menu from Rails.
  // First, dismiss any menu that is currently being presented by deleting its
  // i18n_edit_menu_parent node from the document.
  // Append a new i18n_edit_menu_parent node to the document to contain the new menu.
  // Post a form to the Rails code asking it to render a context menu with the
  // attributes of the HTML node.
  // When Rails renders the menu, event_show_menu() will add the rendered HTML to
  // the innerHTML of the i18n_edit_menu_parent node.
  event_contextmenu(e) {
    this.event_contextmenu_dismiss(e);
    var container = e.target;
    if (container.className != 'i18n_edit' ) {
      while (container != null && container.parentElement != null && container.className != 'i18n_edit_attributes') {
        container = container.parentElement;
      }
    }

    // If the text has already been edited and the user calls for the context menu:
    // First, write the old text. Then wait for the XHR success callback to indicate
    // that the rails code has completed the write. Then, arrange for
    // this.event_xhr_succeeded() to call this method again to put up the menu with
    // the new text. Then return, thus allowing the thread to handle
    // this.event_xhr_succeeded().
    if (container.className == 'i18n_edit' && this.element == container) {
      this.do_update();
      this.deferred_event = function() { this.event_contextmenu(e); };
      return;
    }

    var menu = document.createElement('span');
    menu.setAttribute('class', 'i18n_edit_menu_parent');
    menu.addEventListener('contextmenu', this.call_method(this.event_contextmenu_dismiss));
    document.body.appendChild(menu);

    var i18n = container.getAttribute('data-i18n') || "{ \"text\": \"" + e.target.id + "\" }";
    this.post_form('menu', this.event_show_menu, function(f){
      f.append("x", e.clientX);
      f.append("y", e.clientY);
      f.append("i18n", i18n);
      f.append("token", container.getAttribute('data-token'));
    });
  }

  // Dismiss the menu that is currently being presented, if any.
  event_contextmenu_dismiss(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    var list = document.getElementsByClassName('i18n_edit_menu_parent');
    Array.from(list).forEach(this.call_method(this.destroy_node));
  }
  
  // One of our i18n_edit spans got the focus. 
  // Set element so that we know what we are editing, and set old_text so that we can
  // check the old text before rewriting it or, when necessary, revert to the old text.
  // Submit a form to the Rails code to check the CSRF token. If the CSRF token is wrong,
  // that usually means that the user re-started the Rails server. Reload the page. That
  // will generally get us a correct CSRF token, and the user can continue.
  // This will also catch if the Rails server isn't running, and complain to the user
  // that it must be running to edit the internationalized text.
  event_focus(e) {
    e.preventDefault();
    e.stopPropagation();
    var s = e.target;
    this.element = s;
    this.token = s.getAttribute('data-token');
    // Deep copy innerText rather than take its reference, just in case the browser
    // edits it in place.
    this.old_text = (' ' + s.innerText).slice(1);
    console.log("Editing " + s.id);
    this.post_form('check_token', this.event_xhr_succeeded, function(f){
      f.append('token', this.token);
    });
  }
  
  // One of our i18n_edit spans is losing the focus. Write the edited text, if it has
  // changed.
  event_focusout(e) {
    e.preventDefault();
    e.stopPropagation();
    if ( e.target && e.target == this.element) {
      this.do_update();
    }
  }
  
  // Someone's typing at one of our i18n_edit spans. Save which one, so that the
  // page-unload handler knows what was being edited and can write it.
  event_input(e) {
    e.preventDefault();
    e.stopPropagation();
    // Keep this.element up-to-date, so that event_beforeunload() will get the
    // most recent innerText.
    this.element = e.target;
  }
  
  // This is called when the Rails code renders a context menu in response to an XHR
  // form. Place the rendered text within the i18n_edit_menu_parent node, and connect
  // event handlers so that the editable text within the menu can be edited.
  //
  // This also:
  // * Handles status 202, which means reload the page, usually after a CSRF token
  //   mis-match caused by re-starting Rails.
  // * Presents an alert for any status not otherwise handled.
  event_show_menu(e) {
    var menu_html = e.target.responseText;
    if (e.target.status == 200) {
      var node = document.getElementsByClassName('i18n_edit_menu_parent')[0];
      node.innerHTML = menu_html;
      var list = node.getElementsByClassName('i18n_edit');
      Array.from(list).forEach(this.call_method(this.connect_editor_span), true);
    }
    else {
      this.event_xhr_succeeded(e);
    }
  }

  // If an XHR request failed, it's because the Rails server isn't running. Complain
  // to the user.
  event_xhr_failed() {
    window.alert("i18n_edit: Your rails project must be running so that it can edit its own locale data.")
    this.do_blur();
  }
  
  // Handle XHR requests other than requests for Rails to render a context menu.
  // If status is 200, put the response text on the Javascript console.
  // If status is 202, this indicates a CSRF token mismatch, usually caused by the
  // user re-starting Rails. Reload the page.
  // Any other status indicates a Rails failure, tell the user to see the Rails console.
  event_xhr_succeeded(e) {
    if (e.target.status == 200) {
      var t = e.target.responseText;
      if (t != "OK") {
        console.log(e.target.responseText);
      }
      if (this.deferred_event) {
        this.deferred_event.call(this);
        this.deferred_event = null;
      }
    }
    else if ( e.target.status == 201 ) {
      window.alert(e.target.responseText);
      this.do_blur();
    }
    else if (e.target.status == 202) {
      console.log("i18n_edit: reloading the page: " + e.target.responseText);
      window.location.reload(true);
    }
    else {
      window.alert("Edit failed. Please see the rails diagnostic output.");
      this.do_blur();
    }
  }
  
  // Everywhere that I've stuck a span around translated text and that span has ended
  // up in an attribute of an HTML node (where it's invalid), remove the span, and create
  // an i18n_edit_attributes span around the HTML node in its place.
  // This supports multiple internationalized attributes within one HTML node.
  handle_internationalized_attributes(list, index) {
    var n = list[index];
    const id_pattern = "id\\s*=\\s*([^\\s>]+)[\\s>]";
    const token_pattern = "data-token\\s*=\\s*([^\\s>]+)[\\s>]";
  
    if ( n.nodeType == Node.ELEMENT_NODE && n.className != 'i18n_edit' && n.className != 'i18n_edit_attributes' ) {
      var i18n = {};
      var token;
      var length = n.attributes.length;
      for (var i = 0; i < length; i++ ) {
        var a = n.attributes[i];
        if (a.specified && a.value != '' && a.name != 'class' && a.name != 'id' && a.name != 'style') {
          var span_match = a.value.match(this.span_pattern());
          if (span_match) {
            a.value = span_match[2]
            var id_match = span_match[1].match(id_pattern);
            i18n[a.name] = id_match[1];
            var token_match = span_match[1].match(token_pattern);
            token = token_match[1];
          }
        }
      }
      if (Object.keys(i18n).length > 0) {
        var container = document.createElement('span');
        container.setAttribute('class', 'i18n_edit_attributes');
        container.setAttribute('data-i18n', JSON.stringify(i18n));
        container.setAttribute('data-token', token);
        n.parentNode.replaceChild(container, n);
        container.appendChild(n);
        container.addEventListener('contextmenu', this.call_method(this.event_contextmenu));
      }
    }
  }
  
  // Post a form to Rails using XHR.
  // action is an action to call in the i18n_edit controller.
  // success is the event handler to call when the request succeeds.
  // build_form_data is a function (usually inline) that is passed the form object and
  // creates appropriate form data for the request.
  post_form(action, success_event_handler, build_form_data) {
    var l = window.location
    var url = l.protocol + "//" + l.hostname + (l.port ? ':' + l.port : "") + "/i18n_edit/" + action;
    var x = new XMLHttpRequest();
    var f = new FormData();
    build_form_data.call(this, f);
    x.onload = this.call_method(success_event_handler);
    x.onerror = this.call_method(this.event_xhr_failed);
    x.open('POST', url, true);
    x.send(f)
  }

  // This pattern is used to match the i18n_edit span created by the Rails code.
  span_pattern() {
    return "^(\\s*<span\\s+[^>]*?class\\s*=\\s*i18n_edit[^>]*>)(.*?)</span>\\s*$";
  }
};

window.addEventListener('load', function() {window.i18n_edit = new I18n_Edit();});
