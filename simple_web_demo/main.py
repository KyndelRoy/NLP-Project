from flask import Flask, render_template, request, jsonify

# 1. INITIALIZING THE SERVER
# This line creates the 'Flask application object'. 
# Think of it as the 'brain' of your web server that handles all requests.
app = Flask(__name__)

# 2. DEFINING THE HOME ROUTE
# When you type "http://127.0.0.1:5000/" in your browser, 
# the browser sends a "GET" request to the server.
# This function tells Python what to do when that happens.
@app.route('/')
def home():
    # 'render_template' looks for a file inside the 'templates/' folder.
    # It reads the HTML file and sends it back to your browser.
    return render_template('index.html')

# 3. THE CALCULATOR LOGIC (BACKEND)
# This route specifically handles the data sent by our calculator form.
# We use methods=['POST'] because we are "sending" (posting) data to the server.
@app.route('/calculate', methods=['POST'])
def calculate():
    # We get the data sent by the browser in JSON format.
    # JSON is basically a way for different languages (JavaScript and Python) 
    # to talk to each other using a simple dictionary-like structure.
    data = request.get_json()
    
    # Extracting the values from the browser's message
    num1 = float(data.get('num1', 0))
    num2 = float(data.get('num2', 0))
    operation = data.get('operation', 'add')
    
    # The actual "math" happens here on the server (the Backend)
    if operation == 'add':
        result = num1 + num2
    elif operation == 'subtract':
        result = num1 - num2
    elif operation == 'multiply':
        result = num1 * num2
    elif operation == 'divide':
        result = num1 / num2 if num2 != 0 else "Cannot divide by zero"
    else:
        result = "Invalid operation"

    # 4. SENDING THE ANSWER BACK
    # After calculating, we send the result back to the browser as JSON.
    return jsonify({"result": result})

# 5. STARTING THE SERVER
if __name__ == '__main__':
    # debug=True means the server will restart automatically if you change the code.
    # It also shows helpful error messages in your browser if something goes wrong.
    app.run(debug=True)
