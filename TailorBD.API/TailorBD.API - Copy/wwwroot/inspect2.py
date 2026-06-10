# -*- coding: utf-8 -*-
import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'delivery-cut-dress.html')
with open(path, encoding='utf-8') as f:
    c = f.read()

original = c

# Print exact bytes around problem areas for diagnosis
idx = c.find('Orders that have been delivered')
print('SUBTITLE:', repr(c[idx-20:idx+180]))
idx2 = c.find('Total Delivered')
print('STAT:', repr(c[idx2-20:idx2+120]))
