import subprocess

def get_last_error():
    try:
        # Get last 500 lines
        result = subprocess.run(['docker', 'logs', 'main-tms-backend', '--tail', '500'], capture_output=True, text=True)
        lines = result.stderr.split('\n') # Docker logs often go to stderr
        if not lines or len(lines) < 2:
            lines = result.stdout.split('\n')
            
        # Find the line starting with sqlalchemy.exc or containing "Error"
        for i in range(len(lines) - 1, -1, -1):
            if "sqlalchemy.exc" in lines[i] or "Error:" in lines[i] or "Exception" in lines[i]:
                print("--- FOUND ERROR ---")
                # Print 10 lines before and after
                start = max(0, i - 20)
                end = min(len(lines), i + 5)
                for j in range(start, end):
                    print(lines[j])
                return

        print("No specific error found in the last 500 lines of logs.")
    except Exception as e:
        print(f"Error reading logs: {e}")

if __name__ == "__main__":
    get_last_error()
