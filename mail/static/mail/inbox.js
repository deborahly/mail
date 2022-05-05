document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send email when form is submitted
  const form = document.getElementById('compose-form');
  
  form.addEventListener('submit', function(event) {

    const json_body = { 
      recipients: document.getElementById('compose-recipients').value,
      subject: document.getElementById('compose-subject').value,
      body: document.getElementById('compose-body').value  
    }
    
    send_email('http://127.0.0.1:8000/emails', json_body)
    .then(data => {
      load_mailbox('sent');
      const message = data['message'];
      document.getElementById('message').innerHTML = message;
    });

    event.preventDefault();
      
  });

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

async function send_email(url = '', data = {}) {
  
  const response = await fetch(url, {    
    
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  
  return response.json();
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
  // document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Request SENT emails from server
  if (mailbox == 'sent') {
    
    fetch('http://127.0.0.1:8000/emails/sent')
    .then(response => response.json())
    .then(data => {
      
      if (data.length === 0) {
        document.getElementById('message').innerHTML = "Mailbox empty";
      }

      else {
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
        data.forEach(function(element, index) {
          const email = document.createElement('tr');

          const sender = document.createElement('th');
          sender.innerHTML = data[index]['sender'];
          sender.scope = 'col';
    
          const subject = document.createElement('th');
          subject.innerHTML = data[index]['subject'];
          subject.scope = 'col';
    
          const timestamp = document.createElement('th');
          timestamp.innerHTML = data[index]['timestamp'];
          timestamp.scope = 'col';
    
          email.append(sender);
          email.append(subject);
          email.append(timestamp);
    
          email.addEventListener('click', function() {
            console.log('This element has been clicked!')
          })
    
          document.querySelector('tbody').append(email); 
        })
      }
    });
  
    return false;
  }
}

// async function get_email(email_id) {

//   document.querySelector('#emails-view').style.display = 'none';
//   document.querySelector('#compose-view').style.display = 'none';
//   document.querySelector('#email-view').style.display = 'block';

//   fetch('emails/email_id')
//   .then(response => response.json())
//   .then(data => {

//     const subject = data['subject'];
//     const sender = data['sender'];
//     const timestamp = data['timestamp'];
//     const body = data['body'];

//     document.querySelector('#subject').innerHTML = subject;
//     document.querySelector('#sender').innerHTML = sender;
//     document.querySelector('#timestamp').innerHTML = timestamp;
//     document.querySelector('#body').innerHTML = body;
//   })

//   return false;
// }