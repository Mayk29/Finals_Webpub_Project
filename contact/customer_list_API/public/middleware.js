function loadCustomers() 
{
    fetch('/api/customers')
    .then(response => response.json())
    .then(customers => { 
        const tableBody = document.querySelector('tbody');
        tableBody.innerHTML = ''; 

        customers.forEach(customer => { 
            const row =  
            `<tr>
                <td><img src="/images/avatar.png"></td>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.age}</td>
                <td>${customer.location}</td> 
                <td>${customer.occupation}</td> 
            </tr>`;
    
            tableBody.innerHTML += row; 
        });
    })
    .catch(error => console.log('Error fetching customers.', error)); 
}