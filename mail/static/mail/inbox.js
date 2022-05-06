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
  document.querySelector('#email-view').style.display = 'none';

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

  // Clear message
  document.getElementById('message').innerHTML = '';

  // Clear out composition fields
  document.querySelector('thead').innerHTML = '';
  document.querySelector('tbody').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  // Request emails from server, depending on the mailbox
  fetch(`http://127.0.0.1:8000/emails/${mailbox}`)
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

        // Add gray background if email is read
        if (data[index]['read'] === true) {
          email.classList.add('gray');
        }
  
        email.addEventListener('click', function() {           
          // Get email
          const email_id = data[index]['id'];

          fetch(`http://127.0.0.1:8000/emails/${email_id}`)
          .then(response => response.json())
          .then(data => {
            // Show/hide
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';
            document.querySelector('#email-view').style.display = 'block';
            
            // Clear out
            document.querySelector('#archive').innerHTML = '';
            
            // Store email data
            const subject = data['subject'];
            const sender = data['sender'];
            const recipients = data['recipients'];
            const timestamp = data['timestamp'];
            const body = data['body'];
          
            // Pass data to HTML file
            document.querySelector('#subject').innerHTML = `Subject: ${subject}`;
            document.querySelector('#sender').innerHTML = `From: ${sender}`;
            document.querySelector('#recipients').innerHTML = `To: ${recipients}`;
            document.querySelector('#timestamp').innerHTML = timestamp;
            document.querySelector('#body').innerHTML = body;

            // If inbox mailbox, add archive button
            if (mailbox === 'inbox') {
              const archive_button = document.createElement('input');
              archive_button.id = 'archive-button';
              archive_button.classList.add('btn', 'btn-secondary', 'btn-sm');
              archive_button.type = 'submit';
              archive_button.formAction = `http://127.0.0.1:8000/emails/${email_id}`;
              archive_button.value = 'Archive';
              document.querySelector('#archive').append(archive_button);

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
                  else { console.log("HTTP request unsuccessful for archive request") }
                  return response
                });

                event.preventDefault();
              })
            }

            // If archive mailbox, add unarchive button
            if (mailbox === 'archive') {
              const unarchive_button = document.createElement('input');
              unarchive_button.id = 'archive-button';
              unarchive_button.classList.add('btn', 'btn-secondary', 'btn-sm');
              unarchive_button.type = 'submit';
              unarchive_button.formAction = `http://127.0.0.1:8000/emails/${email_id}`;
              unarchive_button.value = 'Unarchive';
              document.querySelector('#archive').append(unarchive_button);

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
          });

          // Marks as read when email is viewed
          const json_body = { 
            read: 'True'
          }

          const requestOptions = {    
    
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json_body)
          }

          fetch(`http://127.0.0.1:8000/emails/${data[index]['id']}`, requestOptions)
          .then(response => {
            if (response.ok) { console.log("HTTP request successful") }
            else { console.log("HTTP request unsuccessful") }
            return response
          });
        });

        document.querySelector('tbody').append(email); 
      })
    }
  });

  return false;
}