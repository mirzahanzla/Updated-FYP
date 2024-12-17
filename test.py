import boto3

def check_running_instances():
    # Initialize boto3 client for EC2
    ec2_client = boto3.client('ec2')
    regions = [region['RegionName'] for region in ec2_client.describe_regions()['Regions']]
    
    running_instances = []

    for region in regions:
        # Create an EC2 client for each region
        regional_client = boto3.client('ec2', region_name=region)
        
        # Describe instances in the region
        response = regional_client.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )
        
        # Loop through reservations and instances
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                instance_type = instance['InstanceType']
                running_instances.append((instance_id, instance_type, region))
    
    if running_instances:
        print("Running instances found:")
        for instance_id, instance_type, region in running_instances:
            print(f"Instance ID: {instance_id}, Type: {instance_type}, Region: {region}")
    else:
        print("No running instances found in any region.")

# Run the function
check_running_instances()
