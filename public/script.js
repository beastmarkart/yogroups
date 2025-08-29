document.addEventListener('DOMContentLoaded', () => {
    const numStudentsInput = document.getElementById('numStudents');
    const numStudentsValue = document.getElementById('numStudentsValue');
    const groupValueInput = document.getElementById('groupValue');
    const groupValueDisplay = document.getElementById('groupValueDisplay');
    const groupValueLabel = document.getElementById('groupValueLabel');
    const byPeopleRadio = document.getElementById('byPeople');
    const byGroupsRadio = document.getElementById('byGroups');
    const generateButton = document.getElementById('generateButton');
    const outputString = document.getElementById('outputString');
    const disclaimer = document.getElementById('disclaimer');

    // Initial setup for sliders
    numStudentsInput.max = 100; // Max students
    numStudentsInput.min = 1;
    numStudentsInput.value = 20;
    numStudentsValue.textContent = 20;

    // Function to update groupValueInput max based on numStudents
    function updateGroupInputMax() {
        const numStudents = parseInt(numStudentsInput.value);
        if (byPeopleRadio.checked) {
            groupValueInput.max = numStudents > 0 ? numStudents : 1;
            if (parseInt(groupValueInput.value) > numStudents) {
                groupValueInput.value = numStudents > 0 ? numStudents : 1;
            }
        } else { // byGroupsRadio.checked
            groupValueInput.max = numStudents > 0 ? numStudents : 1; // Max groups cannot exceed students
            if (parseInt(groupValueInput.value) > numStudents) {
                groupValueInput.value = numStudents > 0 ? numStudents : 1;
            }
        }
        groupValueDisplay.textContent = groupValueInput.value;
    }

    // --- Event Listeners and UI Logic ---

    numStudentsInput.oninput = (value) => {
        numStudentsValue.textContent = value;
        updateGroupInputMax();
        updateCalculatedValue();
    };

    groupValueInput.oninput = (value) => {
        groupValueDisplay.textContent = value;
        updateCalculatedValue();
    };

    function toggleGroupInput() {
        if (byPeopleRadio.checked) {
            groupValueLabel.textContent = "People per Group:";
            groupValueInput.max = parseInt(numStudentsInput.value); // Max people per group is numStudents
            groupValueInput.min = 1;
            groupValueInput.value = Math.max(1, Math.min(parseInt(groupValueInput.value), parseInt(numStudentsInput.value))); // Adjust if current value is too high
        } else {
            groupValueLabel.textContent = "Number of Groups:";
            groupValueInput.max = parseInt(numStudentsInput.value); // Max groups is numStudents
            groupValueInput.min = 1;
            groupValueInput.value = Math.max(1, Math.min(parseInt(groupValueInput.value), parseInt(numStudentsInput.value))); // Adjust if current value is too high
        }
        groupValueDisplay.textContent = groupValueInput.value;
        updateCalculatedValue();
    }

    function updateStudentValue(value) {
        numStudentsValue.textContent = value;
        updateGroupInputMax(); // Ensure group value max is updated if student count changes
        updateCalculatedValue();
    }

    function updateGroupValue(value) {
        groupValueDisplay.textContent = value;
        updateCalculatedValue();
    }

    // Function to dynamically calculate and display the other locked value
    function updateCalculatedValue() {
        const numStudents = parseInt(numStudentsInput.value);
        const groupValue = parseInt(groupValueInput.value);

        let calculatedNumGroups = 0;
        let calculatedPeoplePerGroup = 0;

        if (numStudents === 0 || groupValue === 0) { // Avoid division by zero
            calculatedNumGroups = 0;
            calculatedPeoplePerGroup = 0;
            disclaimer.textContent = "Please enter valid student and group numbers.";
            return;
        }

        if (byPeopleRadio.checked) {
            // User specified people per group, calculate number of groups
            calculatedNumGroups = Math.ceil(numStudents / groupValue);
            calculatedPeoplePerGroup = groupValue;
            // Update min/max for groupValueInput dynamically
            groupValueInput.max = numStudents; // Max people per group can be total students
            groupValueInput.min = 1;
        } else { // byGroupsRadio.checked
            // User specified number of groups, calculate people per group
            calculatedPeoplePerGroup = Math.ceil(numStudents / groupValue);
            calculatedNumGroups = groupValue;
             // Update min/max for groupValueInput dynamically
            groupValueInput.max = numStudents; // Max groups can be total students
            groupValueInput.min = 1;
        }

        let remainder = numStudents % calculatedPeoplePerGroup;
        if (byPeopleRadio.checked) { // If by people per group, remainder is for *actual* groups
             remainder = numStudents % groupValue;
        } else { // If by number of groups, remainder is for people per group
             remainder = numStudents % groupValue;
        }


        let disclaimerText = "";
        if (numStudents > 0 && groupValue > 0) { // Only show disclaimer if valid inputs
             if (numStudents % groupValue !== 0) { // There's a remainder
                if (byPeopleRadio.checked) {
                     disclaimerText = `Note: Some groups will have ${groupValue + 1} students to distribute the remainder.`;
                } else { // byGroupsRadio.checked
                     const baseStudentsPerGroup = Math.floor(numStudents / groupValue);
                     const numLargerGroups = numStudents % groupValue;
                     disclaimerText = `Note: ${numLargerGroups} groups will have ${baseStudentsPerGroup + 1} students, and ${groupValue - numLargerGroups} groups will have ${baseStudentsPerGroup} students.`;
                }
             }
        } else {
             disclaimerText = "Please enter valid student and group numbers.";
        }
        disclaimer.textContent = disclaimerText;
    }

    // Initialize state
    toggleGroupInput(); // Set initial label and max for groupValueInput
    updateCalculatedValue(); // Show initial remainder info

    // --- Backend API Call Logic ---

    generateButton.onclick = async () => {
        const numStudents = numStudentsInput.value;
        const groupMethod = document.querySelector('input[name="groupMethod"]:checked').value;
        const groupValue = groupValueInput.value;

        outputString.textContent = 'Generating...';
        disclaimer.textContent = ''; // Clear previous disclaimer

        try {
            // Call the Netlify serverless function
            const response = await fetch('/.netlify/functions/generate-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ numStudents, groupMethod, groupValue }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                outputString.textContent = `Error: ${data.error}`;
            } else {
                outputString.textContent = data.assignments;
            }
        } catch (error) {
            console.error('Error:', error);
            outputString.textContent = 'Failed to generate groups. Check console for details.';
        }
    };

    // Ensure update runs on initial load and if student count changes
    numStudentsInput.addEventListener('input', () => {
        numStudentsValue.textContent = numStudentsInput.value;
        updateGroupInputMax();
        updateCalculatedValue();
    });
    groupValueInput.addEventListener('input', () => {
        groupValueDisplay.textContent = groupValueInput.value;
        updateCalculatedValue();
    });
    byPeopleRadio.addEventListener('change', toggleGroupInput);
    byGroupsRadio.addEventListener('change', toggleGroupInput);
    numStudentsInput.dispatchEvent(new Event('input')); // Trigger initial update
});