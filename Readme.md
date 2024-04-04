# Python, PostGis & Flask Project Template

1. Rename the settings_template.py to settings.py
2. Fill out all credentials
3. Add the variable APP_CONFIG_FILE to your environment variables with the value 'settings.py' (or change line 10 of server.py to the following:)
  
   app.config.from_pyfile('settings.py', silent=False))
4. Add another environment variable: FLASK_DEBUG with a value of 1