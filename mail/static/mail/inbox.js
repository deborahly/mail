document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send email when form is submitted
  document.querySelector('#form-button').addEventListener('click', (event) => {
    event.preventDefault();
    send_email();
  });

  // Open email when email is clicked
  emails_view = document.querySelector('#emails-view');
  emails_view.addEventListener('click', event => {
    // Find what was clicked
    const element = event.target;

    // Load email and mark as read
    if (element.className === 'email') {
      const mailbox = element.dataset.mailbox;
      const email_id = element.dataset.id;
      load_email(mailbox, email_id);
      read(email_id);
    }

    event.preventDefault();
  });

  // Add state to browser history, in order to modify url
  header_buttons = document.querySelector('#header-buttons');
  header_buttons.querySelectorAll('button').forEach(button => {
    button.onclick = function() {
      const section = this.id;
      history.pushState({section: section}, '', `${section}`);
    }
  })
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Hide all views temporaly
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Clear message
  document.getElementById('message').innerHTML = '';

  // Clear out composition fields
  document.querySelector('thead').innerHTML = '';
  document.querySelector('tbody').innerHTML = '';

  // Request emails from server, depending on the mailbox
  fetch(`http://127.0.0.1:8000/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    
    if (data.length === 0) {
      document.getElementById('message').innerHTML = "Mailbox empty";
    }

    else {
      load_emails(mailbox, data);
    }

    // Update mailbox name
    document.querySelector('#title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

    // Show the mailbox with animation
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#emails-view').style.animationPlayState = 'running'    
  });
}

function send_email() {

  const json_body = { 
    recipients: document.getElementById('compose-recipients').value,
    subject: document.getElementById('compose-subject').value,
    body: document.getElementById('compose-body').value  
  }

  const requestOptions = {       
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(json_body)
  }
  
  fetch('http://127.0.0.1:8000/emails', requestOptions)
  .then(response => response.json())
  .then(data => {
    load_mailbox('sent');
    alert(data['message']);
  });
}

function load_emails(mailbox, data) {
  // Create table header
  const cols_row = document.createElement('tr')

  const sender_col = document.createElement('th')
  sender_col.innerHTML = 'From';
  sender_col.scope = 'col';

  const subject_col = document.createElement('th')
  subject_col.innerHTML = 'Subject';
  subject_col.scope = 'col';

  const timestamp_col = document.createElement('th')
  timestamp_col.innerHTML = 'Date';
  timestamp_col.scope = 'col';

  cols_row.append(sender_col);
  cols_row.append(subject_col);
  cols_row.append(timestamp_col);

  document.querySelector('thead').append(cols_row);

  // Create table body with emails 
  data.forEach(function(element) {
    const email = document.createElement('tr');

    const sender = document.createElement('td');
    sender.innerHTML = element['sender'];
    sender.scope = 'col';
    sender.classList.add('email');
    sender.dataset.id = element.id;
    sender.dataset.mailbox = mailbox;

    const subject = document.createElement('td');
    subject.innerHTML = element['subject'];
    subject.scope = 'col';
    subject.classList.add('email');
    subject.dataset.id = element.id;
    subject.dataset.mailbox = mailbox;

    const timestamp = document.createElement('td');
    timestamp.innerHTML = element['timestamp'];
    timestamp.scope = 'col';
    timestamp.classList.add('email');
    timestamp.dataset.id = element.id;
    timestamp.dataset.mailbox = mailbox;

    email.append(sender);
    email.append(subject);
    email.append(timestamp);

    // Add gray background if email is read
    if (element['read'] === true) {
      email.classList.add('gray');
    }

    document.querySelector('tbody').append(email);
  });
}

function load_email(mailbox, email_id) {
  fetch(`http://127.0.0.1:8000/emails/${email_id}`)
  .then(response => response.json())
  .then(data => {
    // Show/hide
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    
    // Clear out
    document.querySelector('#buttons').innerHTML = '';
    
    // Store email data
    const subject = data['subject'];
    const sender = data['sender'];
    const archived = data['archived'];
    const recipients = data['recipients'];
    const timestamp = data['timestamp'];
    let body = data['body'];
    let body_r = body.replaceAll('\n', '<br>');
  
    // Pass data to HTML file
    document.querySelector('#subject').innerHTML = `Subject: ${subject}`;
    document.querySelector('#sender').innerHTML = `From: ${sender}`;
    document.querySelector('#recipients').innerHTML = `To: ${recipients}`;
    document.querySelector('#timestamp').innerHTML = timestamp;
    document.querySelector('#body').innerHTML = body_r;

    // For all the mailboxes, add reply button    
    const reply_button = document.createElement('input');
    reply_button.id = 'reply-button';
    reply_button.classList.add('btn', 'btn-secondary', 'btn-sm', 'my-btn');
    reply_button.type = 'submit';
    reply_button.value = 'Reply';
    document.querySelector('#buttons').append(reply_button);

    // Redirect to compose view when button is clicked
    email_view = document.querySelector('#email-view');
    
    email_view.addEventListener('click', event => {
      const element = event.target;
      if (element.id === 'reply-button') {
        compose_reply(sender, subject, timestamp, body);
      }

      event.preventDefault();
    })

    // If inbox mailbox, add archive button
    if (archived === false && mailbox === 'inbox') {
      archive(email_id);
    }

    // If archive mailbox, add unarchive button
    if (archived === true) {
      unarchive(email_id);
    }
  });
}

function compose_reply(sender, subject, timestamp, body) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Pre-fill composition fields
  document.querySelector('#compose-recipients').value = sender;
  document.querySelector('#compose-body').value = `\r\n \r\n \r\n --- \r\n On ${timestamp} ${sender} wrote: \r\n ${body}`;
  if (subject.includes('Re:')) {
    document.querySelector('#compose-subject').value = subject;
  }
  else {
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  }
}

function archive(email_id) {
  // Create button
  const archive_button = document.createElement('input');
  archive_button.id = 'archive-button';
  archive_button.classList.add('btn', 'btn-secondary', 'btn-sm', 'my-btn');
  archive_button.type = 'submit';
  archive_button.formAction = `http://127.0.0.1:8000/emails/${email_id}`;
  archive_button.value = 'Archive';
  document.querySelector('#buttons').append(archive_button);

  // Archive email when button is clicked
  archive_button.addEventListener('click', function(event) {   
    const json_body = { 
      archived: 'True'
    }

    const requestOptions = {    
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(json_body)
    }

    fetch(archive_button.formAction, requestOptions)
    .then(response => {
      if (response.ok) { load_mailbox('inbox') }
      return response
    });

    event.preventDefault();
  })
}

function unarchive(email_id) {
  // Create button
  const unarchive_button = document.createElement('input');
  unarchive_button.id = 'unarchive-button';
  unarchive_button.classList.add('btn', 'btn-secondary', 'btn-sm', 'my-btn');
  unarchive_button.type = 'submit';
  unarchive_button.formAction = `http://127.0.0.1:8000/emails/${email_id}`;
  unarchive_button.value = 'Unarchive';
  document.querySelector('#buttons').append(unarchive_button);

  // Unarchive email when button is clicked
  unarchive_button.addEventListener('click', function(event) {   
    const json_body = { 
      archived: 'False'
    }

    const requestOptions = {    
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(json_body)
    }

    fetch(unarchive_button.formAction, requestOptions)
    .then(response => {
      if (response.ok) { load_mailbox('inbox') }
      else { console.log("HTTP request unsuccessful for unarchive request") }
      return response
    });

    event.preventDefault();
  })
}

function read(email_id) {
  
    // Mark email as read
    const json_body = { 
      read: 'True'
    }

    const requestOptions = {    
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(json_body)
    }

    fetch(`http://127.0.0.1:8000/emails/${email_id}`, requestOptions)
    .then(response => {
      return response
    });   
}