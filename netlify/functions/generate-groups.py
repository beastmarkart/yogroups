import json
import random
import math

def handler(event, context):
    try:
        body = json.loads(event['body'])
        num_students = int(body.get('numStudents'))
        group_method = body.get('groupMethod') # 'byPeople' or 'byGroups'
        group_value = int(body.get('groupValue')) # People per group or number of groups

        if num_students <= 0 or group_value <= 0:
            raise ValueError("Number of students and group value must be positive.")

        # Calculate actual group configuration based on input method and remainder distribution
        if group_method == 'byPeople':
            # User wants groups of `group_value` people
            # Distribute remainder to make some groups 1 larger
            groups = []
            remaining_students = num_students
            
            # Calculate base group size and number of larger groups
            num_base_groups = math.floor(num_students / group_value)
            remainder = num_students % group_value

            # If remainder exists, distribute it
            if remainder > 0:
                for _ in range(remainder):
                    groups.append(group_value + 1)
                for _ in range(num_base_groups - remainder): # The remaining base groups
                     groups.append(group_value)
                if num_base_groups == 0: # Edge case: if num_students < group_value
                    groups = [num_students]
            else:
                for _ in range(num_base_groups):
                    groups.append(group_value)
            
            # Calculate the final number of groups formed
            final_num_groups = len(groups)
            
        elif group_method == 'byGroups':
            # User wants `group_value` number of groups
            # Distribute students as evenly as possible
            final_num_groups = group_value
            base_students_per_group = num_students // final_num_groups
            remainder = num_students % final_num_groups
            
            groups = []
            for i in range(final_num_groups):
                group_size = base_students_per_group + (1 if i < remainder else 0)
                groups.append(group_size)
        else:
            raise ValueError("Invalid group method specified.")

        # Generate random assignments
        # Create a list of group assignments, e.g., [1, 1, 1, 2, 2, 2, 3, 3, 3]
        assignments_list = []
        for i, count in enumerate(groups):
            assignments_list.extend([i + 1] * count) # Group numbers start from 1

        random.shuffle(assignments_list) # Randomize the order

        # Convert to the desired comma-separated string
        result_string = ", ".join(map(str, assignments_list))

        return {
            'statusCode': 200,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps({'assignments': result_string})
        }

    except ValueError as ve:
        return {
            'statusCode': 400,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps({'error': str(ve)})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps({'error': f"Internal Server Error: {str(e)}"})
        }