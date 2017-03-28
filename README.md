# I18n::Edit
This in-place editor takes all of the hassle out of managing internationalized text.
Just click on internationalized text where it usually appears on your live site and
edit it right there, with no need to know the translation key, working in only one
window. Right-click on text to see its translation key. Right-click on any HTML node
to edit its internationalized attributes (like tooltips). Right-click on links and other
clickable objects to edit their text.

## Usage
Warning: If you have comments in your locale files, they will be erased as those files
are edited.

Invoke your rails project this way:

   I18N_EDIT=1 rails s

Just click on internationalzed text and edit it, right where it appears. Text is written
to your locale file when you change the focus to another element, or go to another page.
Right-click on any internationalized text or any HTML node with internationalized
attributes to see a menu which allows you to edit them.

A browser that implements *contenteditable* and Javascript ES6 is required. Any recent
version of Chrome or Firefox should do.

The javascript console will tell you what key you're editing and when the data is
written. But you don't really have to look at that to use this tool. Just click on the
text where it usually appears, and edit!

## Installation
Add the gem 'i18n-edit' to your Gemfile and run "bundle install".

Add this line to your routes in config/routes:

  i18n_edit_routes

In app/views/layouts, add this line within the <head> element of your layout (or
more than one layout, depending on your project), to include the required Javascript
file:

  = i18n_edit_assets

## How It Works
If I18N_EDIT is not set in the environment, this gem does nothing and should not
harm your application or its security. When it's set, the magic happens.

I18n.translate() is patched to emit a html-safe span containing the editable translation
text, with the contenteditable attribute set. Javascript catches all of the
internationalized attributes containing this span, removes it, and places a span
around the HTML node instead. Javascript is used to catch editing events and requests
to update the locale text to your rails project. A controller and routes are added to
handle those requests.

Only locale files under the root of your rails project (rather than ones in gems, etc.)
will be edited. Locale files are replaced using the link-create-write-fsync-rename
algorithm, which assures that there will always be valid data in your locale files, even
across a system crash.

## Security

Anyone who can access your pages can edit your locale data! So don't run with
I18N_EDIT=1 set if anyone outside can access your pages. A CSRF token is used,
so only someone who can read the page will be able to write the locale data.
The i18n_edit controller will reject everything if I18N_EDIT is not set in the
environment when you start your rails project.


## Contributing

Write to bruce@perens.com


## License
This software is copyright (C) 2017 Equipment Unit LLC, All rights reserved.

SIMPLE TESTING GRANT

You may combine this software with your own software, for the purpose of your testing
and development of that software. This grant does not apply to other purposes, for
example the integration of this software into a larger product which is distributed to
others or performed to others as a service.

If this grant is insufficient for your needs, you may alternatively apply the terms of
the GNU AFFERO GPL 3, or you may purchase a commercial license from Equipment Unit LLC.
Write to bruce@perens.com .

WARNING: Dynamic linking does not insulate your work from the obligations of either
license. This was confirmed by the decision on APIs and derivative works by the appeals
court in Oracle v. Google.
