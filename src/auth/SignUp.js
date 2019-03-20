/*
 *   Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */
import React from 'react';
import { Auth } from 'aws-amplify';
import DynamicImage from '../components/DynamicImage';
import { withRouter } from 'react-router-dom';
import logo from '../public/images/LTLogo.png';
import '../public/css/app.css';

/**
 * Registration Page
 */
class SignUp extends React.Component {
  constructor(props) {
    super(props);
    //this.state = JSON.parse(localStorage.getItem('SignUpState'))
	console.log(this.state)
	if(!this.state || !this.state.stage)
	{
		console.log('Resetting state');
		this.setLocalStorage({
			stage: 0,
			email: '',
			password: '',
			confirm: '',
			code: ''
		});
	}
	
  }

  async onSubmitForm(e) {
    e.preventDefault();
	if(this.state.password !== this.state.confirm) {
		alert("Your passwords do not match.");
		return 
	}
    try {
      const params = {
        username: this.state.email,
        password: this.state.password,
        attributes: {
	        email: this.state.email
        },
        validationData: []
      };
      const data = await Auth.signUp(params);
	  this.state.stage = 1;
	  this.setLocalStorage(this.state);
    } catch (err) {
      if (err === "No userPool") {
        // User pool not defined in Amplify config file
        console.error("User Pool not defined");
        alert("User Pool not defined. Amplify config must be updated with user pool config");
      } else if (err.message === "User already exists") {
        // Setting state to allow user to proceed to enter verification code
        this.state.stage = 1;
	  this.setLocalStorage(this.state);
      } else {
        if (err.message.indexOf("phone number format") >= 0) {err.message = "Invalid phone number format. Must include country code. Example: +14252345678"}
        alert(err.message);
        console.error("Exception from Auth.signUp: ", err);
        this.setState({ stage: 0, email: '', password: '', confirm: '' });
		this.state.email= '';
		this.state.password= '';
		this.state.confirm= '';
		this.state.stage = 0;
		this.setLocalStorage(this.state);
      }
    }
  }

  async onSubmitVerification(e) {
    e.preventDefault();
    try {
      const data = await Auth.confirmSignUp(
          this.state.email,
          this.state.code
      );
      console.log(data);
      // Go to the sign in page
      this.props.history.replace('/signin');
    } catch (err) {
      alert(err.message);
      console.error("Exception from Auth.confirmSignUp: ", err);
    }
  }

  onEmailChanged(e) {
	this.state.email=e.target.value.toLowerCase();
	this.setLocalStorage(this.state);
  }


  onPasswordChanged(e) {
    this.setState({ password: e.target.value });
  }

  onConfirmationChanged(e) {
	this.state.confirm=e.target.value;
	this.setLocalStorage(this.state);
  }

  onCodeChanged(e) {
	this.state.code=e.target.value;
	this.setLocalStorage(this.state);
  }

  isValidEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  goToSignInPage(e) {
      this.props.history.replace('/signin');

  }

  renderSignUp() {
    const isValidEmail = this.isValidEmail(this.state.email);
    const isValidPassword = this.state.password.length > 6;
    const isValidConfirmation = isValidPassword && this.state.password === this.state.confirm;
	
    return (
      <div className="app">
        <header>
          <img src={logo}/>
        </header>
        <section className="form-wrap">
		  <p>Your Password needs to have at least one of each: uppercase letter, lowercase letter and number, and be 8 characters long</p>
          <form id="registrationForm" onSubmit={(e) => this.onSubmitForm(e)}>
            <input className={isValidEmail?'valid':'invalid'} type="email" placeholder="Email" value={this.state.email} onChange={(e) => this.onEmailChanged(e)}/>
            <input className={isValidPassword?'valid':'invalid'} type="password" placeholder="Password" value={this.state.password} onChange={(e) => this.onPasswordChanged(e)}/>
            <input className={isValidConfirmation?'valid':'invalid'} type="password" placeholder="Confirm Password" value={this.state.confirm} onChange={(e) => this.onConfirmationChanged(e)}/>
			<input disabled={!(isValidEmail && isValidPassword && isValidConfirmation)} type="submit" value="Sign Up"/>
          </form>
		  <div id="buttonContainer">
			<p id="portal">Already have an account?</p>
			<a href="/signin">Login</a>
		  </div>
        </section>
		
		
      </div>
    );
  }

  renderConfirm() {
    const isValidEmail = this.isValidEmail(this.state.email);
    const isValidCode = this.state.code.length === 6;

    return (
      <div className="app">
        <header>
          <img src={logo}/>
        </header>
        <div className="centered">
          <h3 className="title icon-download">Registration Submitted</h3>
          <p className="content">Great! You'll be able to sign in once the Administrator has approved your request</p>
		  <button type="button" onClick={(e) => this.goToSignInPage(e)}>Sign In</button>
        </div>
      </div>
    );
  }

  render() {
    switch (this.state.stage) {
      case 0:
      default:
        return this.renderSignUp();
      case 1:
        return this.renderConfirm();
    }
  }
  
  setLocalStorage(jsonObj) {
	  this.state=jsonObj;
	  this.setState(jsonObj);
	  //localStorage.setItem('SignUpState', JSON.stringify(this.state))
	  
  }
}

export default withRouter(SignUp);
