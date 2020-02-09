export function stringifyQuery (obj) {
    const res = obj ? Object.keys(obj).sort().map(key => {
        const val = obj[key];
  
        if (val === undefined) {
            return '';
        }
    
        if (val === null) {
            return encode(key);
        }
    
        if (Array.isArray(val)) {
            const result = [];
            val.slice().forEach(val2 => {
                if (val2 === undefined) {
                    return;
                }
                if (val2 === null) {
                    result.push(encode(key));
                } else {
                    result.push(encode(key) + '=' + encode(val2));
                }
            });
            return result.join('&');
        }
  
        return encode(key) + '=' + encode(val);
    }).filter(x => x.length > 0).join('&') : null;
    return res ? `?${res}` : '';
}