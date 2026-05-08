import csv
import urllib.request
import urllib.parse
import json
import time
from concurrent.futures import ThreadPoolExecutor

# this is used for the translation of the dataset

def translate_text(text):
    if not text.strip():
        return ""
    try:
        url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=tl&tl=en&dt=t&q=' + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, timeout=10)
        data = json.loads(response.read().decode('utf-8'))
        if data and data[0]:
            return ''.join([d[0] for d in data[0] if d[0]])
        return ""
    except Exception as e:
        time.sleep(1)
        # retry once
        try:
            response = urllib.request.urlopen(req, timeout=10)
            data = json.loads(response.read().decode('utf-8'))
            if data and data[0]:
                return ''.join([d[0] for d in data[0] if d[0]])
            return ""
        except Exception as e2:
            return f"ERROR: {e2}"

def main():
    input_file = 'directory here for input'
    output_file = 'here directory for output'
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        lines = [row for row in reader if row]
        
    print(f"Read {len(lines)} lines from {input_file}.")
    
    header = lines[0] # Usually ['tagalog']
    data = [row[0] for row in lines[1:]]
    
    print("Starting translation...")
    
    results = []
    total = len(data)
    
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=5) as executor:
        for i, res in enumerate(executor.map(translate_text, data)):
            results.append(res)
            if (i+1) % 500 == 0:
                print(f"Translated {i+1}/{total} sentences. Elapsed: {time.time()-start_time:.2f}s")
        
    print("Writing to output file...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['tagalog', 'english'])
        for original, translated in zip(data, results):
            writer.writerow([original, translated])
            
    print("Done!")

if __name__ == '__main__':
    main()
