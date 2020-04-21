import React, { useState, useEffect, useContext, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { NotificationDispatchContext } from '../../contexts/NotificationContext';
import Form from '../elements/Form';
import Input from '../elements/Input';
import Label from '../elements/Label';
import Select from '../elements/Select';
import InputGroup from '../elements/InputGroup';
import PasswordInput from '../elements/PasswordInput';
import FormError from '../blocks/FormError';
import Button from '../elements/Button';
import SpeechSynthesisLanguageGoogle from '../../data/SpeechSynthesisLanguageGoogle';
import SpeechSynthesisLanguageAws from '../../data/SpeechSynthesisLanguageAws';
import SpeechRecognizerLanguageGoogle from '../../data/SpeechRecognizerLanguageGoogle';
import Loader from '../blocks/Loader';

const ApplicationForm = props => {
  let history = useHistory();
  const dispatch = useContext(NotificationDispatchContext);

  // Refs
  const refName = useRef(null);
  const refCallWebhook = useRef(null);
  const refCallWebhookUser = useRef(null);
  const refCallWebhookPass = useRef(null);
  const refStatusWebhook = useRef(null);
  const refStatusWebhookUser = useRef(null);
  const refStatusWebhookPass = useRef(null);
  const refAccount = useRef(null);

  // Form inputs
  const [ name,                     setName                     ] = useState('');
  const [ callWebhook,              setCallWebhook              ] = useState('');
  const [ callWebhookMethod,        setCallWebhookMethod        ] = useState('POST');
  const [ callWebhookUser,          setCallWebhookUser          ] = useState('');
  const [ callWebhookPass,          setCallWebhookPass          ] = useState('');
  const [ statusWebhook,            setStatusWebhook            ] = useState('');
  const [ statusWebhookMethod,      setStatusWebhookMethod      ] = useState('POST');
  const [ statusWebhookUser,        setStatusWebhookUser        ] = useState('');
  const [ statusWebhookPass,        setStatusWebhookPass        ] = useState('');
  const [ speechSynthesisVendor,    setSpeechSynthesisVendor    ] = useState('google');
  const [ speechSynthesisLanguage,  setSpeechSynthesisLanguage  ] = useState('en-US');
  const [ speechSynthesisVoice,     setSpeechSynthesisVoice     ] = useState('en-US-Standard-C');
  const [ speechRecognizerVendor,   setSpeechRecognizerVendor   ] = useState('google');
  const [ speechRecognizerLanguage, setSpeechRecognizerLanguage ] = useState('en-US');
  const [ accountSid,               setAccountSid               ] = useState('');

  // Invalid form inputs
  const [ invalidName,              setInvalidName              ] = useState(false);
  const [ invalidCallWebhook,       setInvalidCallWebhook       ] = useState(false);
  const [ invalidCallWebhookUser,   setInvalidCallWebhookUser   ] = useState(false);
  const [ invalidCallWebhookPass,   setInvalidCallWebhookPass   ] = useState(false);
  const [ invalidStatusWebhook,     setInvalidStatusWebhook     ] = useState(false);
  const [ invalidStatusWebhookUser, setInvalidStatusWebhookUser ] = useState(false);
  const [ invalidStatusWebhookPass, setInvalidStatusWebhookPass ] = useState(false);
  const [ invalidAccount,           setInvalidAccount           ] = useState(false);

  const [ showLoader, setShowLoader ] = useState(true);
  const [ errorMessage, setErrorMessage ] = useState('');

  const [ showCallAuth, setShowCallAuth ] = useState(false);
  const toggleCallAuth = () => setShowCallAuth(!showCallAuth);

  const [ showStatusAuth, setShowStatusAuth ] = useState(false);
  const toggleStatusAuth = () => setShowStatusAuth(!showStatusAuth);

  const [ accounts,       setAccounts       ] = useState([]);
  const [ applications,   setApplications   ] = useState([]);
  const [ applicationSid, setApplicationSid ] = useState([]);

  // See if user logged in
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      history.push('/');
      dispatch({
        type: 'ADD',
        level: 'error',
        message: 'You must log in to view that page.',
      });
    }
  }, [history, dispatch]);

  // Get Account info
  // Account SID needed for setup/add (when creating a new application
  // Account list needed add/edit
  useEffect(() => {
    const getAPIData = async () => {
      try {
        const accountsPromise = axios({
          method: 'get',
          baseURL: process.env.REACT_APP_API_BASE_URL,
          url: '/Accounts',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const applicationsPromise = axios({
          method: 'get',
          baseURL: process.env.REACT_APP_API_BASE_URL,
          url: '/Applications',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const promiseAllValues = await Promise.all([
          accountsPromise,
          applicationsPromise,
        ]);

        const accounts     = promiseAllValues[0].data;
        const applications = promiseAllValues[1].data;

        setAccounts(accounts);
        setApplications(applications);

        if (
          (props.type === 'setup' && accounts.length > 1) ||
          (props.type === 'setup' && applications.length > 1)
        ) {
          history.push('/internal/applications');
          dispatch({
            type: 'ADD',
            level: 'error',
            message: 'That page is only accessible during setup',
          });
        }

        if (props.type === 'add' && accounts.length === 1) {
          setAccountSid(accounts[0].account_sid);
        }

        if (props.type === 'setup' || props.type === 'edit') {
          const currentApplication = props.type === 'edit'
            ? applications.filter(a => a.application_sid === props.application_sid)
            : applications;

          if (props.type === 'edit' && !currentApplication.length) {
            history.push('/internal/applications');
            dispatch({
              type: 'ADD',
              level: 'error',
              message: 'That application does not exist',
            });
            return;
          }

          if (!currentApplication.length) {
            setName('default application');
            setAccountSid(accounts[0].account_sid);
          } else {
            const app = currentApplication[0];
            setName(                     app.name || '');
            setCallWebhook(              (app.call_hook && app.call_hook.url)      || '');
            setCallWebhookMethod(        (app.call_hook && app.call_hook.method)   || 'post');
            setCallWebhookUser(          (app.call_hook && app.call_hook.username) || '');
            setCallWebhookPass(          (app.call_hook && app.call_hook.password) || '');
            setStatusWebhook(            (app.call_status_hook && app.call_status_hook.url)      || '');
            setStatusWebhookMethod(      (app.call_status_hook && app.call_status_hook.method)   || 'post');
            setStatusWebhookUser(        (app.call_status_hook && app.call_status_hook.username) || '');
            setStatusWebhookPass(        (app.call_status_hook && app.call_status_hook.password) || '');
            setSpeechSynthesisVendor(    app.speech_synthesis_vendor    || '');
            setSpeechSynthesisLanguage(  app.speech_synthesis_language  || '');
            setSpeechSynthesisVoice(     app.speech_synthesis_voice     || '');
            setSpeechRecognizerVendor(   app.speech_recognizer_vendor   || '');
            setSpeechRecognizerLanguage( app.speech_recognizer_language || '');
            setAccountSid(               app.account_sid                || '');
            setApplicationSid(           app.application_sid);
            if (
              (app.call_hook && app.call_hook.username) ||
              (app.call_hook && app.call_hook.password)
            ) {
              setShowCallAuth(true);
            }

            if (
              (app.call_status_hook && app.call_status_hook.username) ||
              (app.call_status_hook && app.call_status_hook.password)
            ) {
              setShowStatusAuth(true);
            }
          }
        }
        setShowLoader(false);
      } catch (err) {
        setErrorMessage('Something went wrong, please try again');
        dispatch({
          type: 'ADD',
          level: 'error',
          message: (err.response && err.response.message) || 'Unable to get accounts',
        });
        console.log(err.response || err);
        setShowLoader(false);
      }
    };
    getAPIData();
    // eslint-disable-next-line
  }, []);


  const handleSumit = async (e) => {
    try {
      e.preventDefault();
      setErrorMessage('');
      setInvalidName(false);
      setInvalidCallWebhook(false);
      setInvalidCallWebhookUser(false);
      setInvalidCallWebhookPass(false);
      setInvalidStatusWebhook(false);
      setInvalidStatusWebhookUser(false);
      setInvalidStatusWebhookPass(false);
      setInvalidAccount(false);
      let errorMessages = [];
      let focusHasBeenSet = false;

      if ((props.type === 'add' || props.type === 'edit') && !name) {
        errorMessages.push('Please provide a name.');
        setInvalidName(true);
        if (!focusHasBeenSet) {
          refName.current.focus();
          focusHasBeenSet = true;
        }
      }

      // check if name is already in use

      if (!callWebhook) {
        errorMessages.push('Please enter a Calling Webhook.');
        setInvalidCallWebhook(true);
        if (!focusHasBeenSet) {
          refCallWebhook.current.focus();
          focusHasBeenSet = true;
        }
      }

      if (!statusWebhook) {
        errorMessages.push('Please enter a Call Status Webhook.');
        setInvalidStatusWebhook(true);
        if (!focusHasBeenSet) {
          refStatusWebhook.current.focus();
          focusHasBeenSet = true;
        }
      }

      if ((callWebhookUser && !callWebhookPass) || (!callWebhookUser && callWebhookPass)) {
        errorMessages.push('Calling Webhook username and password must be either both filled out or both empty.');
        setInvalidCallWebhookUser(true);
        setInvalidCallWebhookPass(true);
        if (!focusHasBeenSet) {
          if (!callWebhookUser) {
            refCallWebhookUser.current.focus();
          } else {
            refCallWebhookPass.current.focus();
          }
          focusHasBeenSet = true;
        }
      }

      if ((statusWebhookUser && !statusWebhookPass) || (!statusWebhookUser && statusWebhookPass)) {
        errorMessages.push('Call Status Webhook username and password must be either both filled out or both empty.');
        setInvalidStatusWebhookUser(true);
        setInvalidStatusWebhookPass(true);
        if (!focusHasBeenSet) {
          if (!statusWebhookUser) {
            refStatusWebhookUser.current.focus();
          } else {
            refStatusWebhookPass.current.focus();
          }
          focusHasBeenSet = true;
        }
      }

      if ((props.type === 'add' || props.type === 'edit') && !accountSid) {
        errorMessages.push('Please choose an account for this application to be associated with.');
        setInvalidAccount(true);
        if (!focusHasBeenSet) {
          refAccount.current.focus();
          focusHasBeenSet = true;
        }
      }

      if (errorMessages.length > 1) {
        setErrorMessage(errorMessages);
        return;
      } else if (errorMessages.length === 1) {
        setErrorMessage(errorMessages[0]);
        return;
      }

      //=============================================================================
      // Submit
      //=============================================================================
      const shouldCreateNew = props.type === 'add' || (props.type === 'setup' && !applications.length);

      const method = shouldCreateNew
        ? 'post'
        : 'put';

      const url = shouldCreateNew
        ? '/Applications'
        : `/Applications/${applicationSid}`;

      const data = {
        account_sid: accountSid,
        name,
        call_hook: {
          url: callWebhook,
          method: callWebhookMethod,
          username: callWebhookUser || null,
          password: callWebhookPass || null,
        },
        call_status_hook: {
          url: statusWebhook,
          method: statusWebhookMethod,
          username: statusWebhookUser || null,
          password: statusWebhookPass || null,
        },
        speech_synthesis_vendor:    speechSynthesisVendor,
        speech_synthesis_language:  speechSynthesisLanguage,
        speech_synthesis_voice:     speechSynthesisVoice,
        speech_recognizer_vendor:   speechRecognizerVendor,
        speech_recognizer_language: speechRecognizerLanguage,
      };

      await axios({
        method,
        baseURL: process.env.REACT_APP_API_BASE_URL,
        url,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        data,
      });

      if (props.type === 'setup') {
        history.push('/configure-sip-trunk');
      } else {
        history.push('/internal/applications');
        const dispatchMessage = props.type === 'add'
          ? 'Application created successfully'
          : 'Application updated successfully';
        dispatch({
          type: 'ADD',
          level: 'success',
          message: dispatchMessage
        });
      }

    } catch (err) {
      if (err.response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.clear();
        history.push('/');
        dispatch({
          type: 'ADD',
          level: 'error',
          message: 'Your session has expired. Please log in and try again',
        });
      } else {
        setErrorMessage((err.response && err.response.data && err.response.data.msg) || 'Something went wrong, please try again');
        console.log(err.response || err);
      }
    }
  };

  return (
    showLoader
      ? <Loader height={props.type === 'setup' ? '505px' : '630px'}/>
      : <Form
          large
          onSubmit={handleSumit}
        >
          {(props.type === 'add' || props.type === 'edit') && (
            <React.Fragment>
              <Label htmlFor="name">Name</Label>
              <Input
                large={props.type === 'setup'}
                name="name"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Application name"
                invalid={invalidName}
                autoFocus
                ref={refName}
              />
              <hr />
            </React.Fragment>
          )}

          <Label htmlFor="callWebhook">Calling Webhook</Label>
          <InputGroup>
            <Input
              large={props.type === 'setup'}
              name="callWebhook"
              id="callWebhook"
              value={callWebhook}
              onChange={e => setCallWebhook(e.target.value)}
              placeholder="URL for your web application that will handle calls"
              invalid={invalidCallWebhook}
              ref={refCallWebhook}
              autoFocus={props.type === 'setup'}
            />

            <Label
              middle
              htmlFor="callWebhookMethod"
            >
              Method
            </Label>
            <Select
              large={props.type === 'setup'}
              name="callWebhookMethod"
              id="callWebhookMethod"
              value={callWebhookMethod}
              onChange={e => setCallWebhookMethod(e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </Select>
          </InputGroup>

          {showCallAuth ? (
            <InputGroup>
              <Label indented htmlFor="callWebhookUser">User</Label>
              <Input
                large={props.type === 'setup'}
                name="callWebhookUser"
                id="callWebhookUser"
                value={callWebhookUser}
                onChange={e => setCallWebhookUser(e.target.value)}
                invalid={invalidCallWebhookUser}
                ref={refCallWebhookUser}
              />
              <Label htmlFor="callWebhookPass" middle>Password</Label>
              <PasswordInput
                large={props.type === 'setup'}
                allowShowPassword
                name="callWebhookPass"
                id="callWebhookPass"
                password={callWebhookPass}
                setPassword={setCallWebhookPass}
                setErrorMessage={setErrorMessage}
                invalid={invalidCallWebhookPass}
                ref={refCallWebhookPass}
              />
            </InputGroup>
          ) : (
            <Button
              text
              formLink
              type="button"
              onClick={toggleCallAuth}
            >
              Use HTTP Basic Authentication
            </Button>
          )}

          <hr />

          <Label htmlFor="statusWebhook">Call Status Webhook</Label>
          <InputGroup>
            <Input
              large={props.type === 'setup'}
              name="statusWebhook"
              id="statusWebhook"
              value={statusWebhook}
              onChange={e => setStatusWebhook(e.target.value)}
              placeholder="URL for your web application that will receive call status"
              invalid={invalidStatusWebhook}
              ref={refStatusWebhook}
            />

            <Label
              middle
              htmlFor="statusWebhookMethod"
            >
              Method
            </Label>
            <Select
              large={props.type === 'setup'}
              name="statusWebhookMethod"
              id="statusWebhookMethod"
              value={statusWebhookMethod}
              onChange={e => setStatusWebhookMethod(e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </Select>
          </InputGroup>

          {showStatusAuth ? (
            <InputGroup>
              <Label indented htmlFor="statusWebhookUser">User</Label>
              <Input
                large={props.type === 'setup'}
                name="statusWebhookUser"
                id="statusWebhookUser"
                value={statusWebhookUser}
                onChange={e => setStatusWebhookUser(e.target.value)}
                invalid={invalidStatusWebhookUser}
                ref={refStatusWebhookUser}
              />
              <Label htmlFor="statusWebhookPass" middle>Password</Label>
              <PasswordInput
                large={props.type === 'setup'}
                allowShowPassword
                name="statusWebhookPass"
                id="statusWebhookPass"
                password={statusWebhookPass}
                setPassword={setStatusWebhookPass}
                setErrorMessage={setErrorMessage}
                invalid={invalidStatusWebhookPass}
                ref={refStatusWebhookPass}
              />
            </InputGroup>
          ) : (
            <Button
              text
              formLink
              type="button"
              onClick={toggleStatusAuth}
            >
              Use HTTP Basic Authentication
            </Button>
          )}

          <hr />

          <Label htmlFor="speechSynthesisVendor">Speech Synthesis Vendor</Label>
          <InputGroup>
            <Select
              large={props.type === 'setup'}
              name="speechSynthesisVendor"
              id="speechSynthesisVendor"
              value={speechSynthesisVendor}
              onChange={e => {
                setSpeechSynthesisVendor(e.target.value);

                // When using Google and en-US, ensure "Standard-C" is used as default
                if (
                  e.target.value === 'google' &&
                  speechSynthesisLanguage === 'en-US'
                ) {
                  setSpeechSynthesisVoice('en-US-Standard-C');
                  return;
                }

                // Google and AWS have different voice lists. See if the newly
                // chosen vendor has the same language as what was already in use.
                let newLang = e.target.value === 'google'
                  ? SpeechSynthesisLanguageGoogle.find(l => (
                      l.code === speechSynthesisLanguage
                    ))
                  : SpeechSynthesisLanguageAws.find(l => (
                      l.code === speechSynthesisLanguage
                    ));

                // if not, use en-US as fallback.
                if (!newLang) {
                  setSpeechSynthesisLanguage('en-US');

                  if (e.target.value === 'google') {
                    setSpeechSynthesisVoice('en-US-Standard-C');
                    return;
                  }

                  newLang = SpeechSynthesisLanguageAws.find(l => (
                    l.code === 'en-US'
                  ));
                }

                // Update state to reflect first voice option for language
                setSpeechSynthesisVoice(newLang.voices[0].value);
              }}
            >
              <option value="google">Google</option>
              <option value="aws">AWS</option>
            </Select>
            <Label middle htmlFor="speechSynthesisLanguage">Language</Label>
            <Select
              large={props.type === 'setup'}
              name="speechSynthesisLanguage"
              id="speechSynthesisLanguage"
              value={speechSynthesisLanguage}
              onChange={e => {
                setSpeechSynthesisLanguage(e.target.value);

                // When using Google and en-US, ensure "Standard-C" is used as default
                if (
                  (speechSynthesisVendor === 'google')
                  && (e.target.value === 'en-US')
                ) {
                  setSpeechSynthesisVoice('en-US-Standard-C');
                  return;
                }

                const newLang = speechSynthesisVendor === 'google'
                  ? SpeechSynthesisLanguageGoogle.find(l => (
                      l.code === e.target.value
                    ))
                  : SpeechSynthesisLanguageAws.find(l => (
                      l.code === e.target.value
                    ));

                setSpeechSynthesisVoice(newLang.voices[0].value);

              }}
            >
              {speechSynthesisVendor === 'google' ? (
                SpeechSynthesisLanguageGoogle.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))
              ) : (
                SpeechSynthesisLanguageAws.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))
              )}
            </Select>
            <Label middle htmlFor="speechSynthesisVoice">Voice</Label>
            <Select
              large={props.type === 'setup'}
              name="speechSynthesisVoice"
              id="speechSynthesisVoice"
              value={speechSynthesisVoice}
              onChange={e => setSpeechSynthesisVoice(e.target.value)}
            >
              {speechSynthesisVendor === 'google' ? (
                SpeechSynthesisLanguageGoogle
                  .filter(l => l.code === speechSynthesisLanguage)
                  .map(m => m.voices.map(v => (
                      <option key={v.value} value={v.value}>{v.name}</option>
                  )))
              ) : (
                SpeechSynthesisLanguageAws
                    .filter(l => l.code === speechSynthesisLanguage)
                    .map(m => m.voices.map(v => (
                        <option key={v.value} value={v.value}>{v.name}</option>
                    )))
              )}
            </Select>
          </InputGroup>

          <hr />

          <Label htmlFor="speechRecognizerVendor">Speech Recognizer Vendor</Label>
          <InputGroup>
            <Select
              large={props.type === 'setup'}
              name="speechRecognizerVendor"
              id="speechRecognizerVendor"
              value={speechRecognizerVendor}
              onChange={e => setSpeechRecognizerVendor(e.target.value)}
            >
              <option value="google">Google</option>
            </Select>
            <Label middle htmlFor="speechRecognizerLanguage">Language</Label>
            <Select
              large={props.type === 'setup'}
              name="speechRecognizerLanguage"
              id="speechRecognizerLanguage"
              value={speechRecognizerLanguage}
              onChange={e => setSpeechRecognizerLanguage(e.target.value)}
            >
              {SpeechRecognizerLanguageGoogle.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </Select>
          </InputGroup>

          {(props.type === 'add' || props.type === 'edit') && (
            <React.Fragment>
              <hr />
              <Label htmlFor="account">Account</Label>
              <Select
                large={props.type === 'setup'}
                name="account"
                id="account"
                value={accountSid}
                onChange={e => setAccountSid(e.target.value)}
                invalid={invalidAccount}
                ref={refAccount}
              >
                {(
                  (accounts.length > 1) ||
                  (props.type === 'edit' && accounts[0] && accountSid !== accounts[0].account_sid)
                ) && (
                  <option value="">
                    -- Choose the account this application will be associated with --
                  </option>
                )}
                {accounts.map(a => (
                  <option
                    key={a.account_sid}
                    value={a.account_sid}
                  >
                    {a.name}
                  </option>
                ))}
              </Select>
            </React.Fragment>
          )}

          {errorMessage && (
            <FormError grid message={errorMessage} />
          )}

          <InputGroup flexEnd spaced>
            {props.type === 'edit' && (
              <Button
                grid
                gray
                type="button"
                onClick={() => {
                  history.push('/internal/applications');
                  dispatch({
                    type: 'ADD',
                    level: 'info',
                    message: 'Changes canceled',
                  });
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              large={props.type === 'setup'}
              grid
              fullWidth={props.type === 'setup' || props.type === 'add'}
            >
              {props.type === 'setup'
                ? 'Save and Continue'
                : props.type === 'add'
                  ? 'Add Application'
                  : 'Save'
              }
            </Button>
          </InputGroup>
        </Form>
  );
};

export default ApplicationForm;