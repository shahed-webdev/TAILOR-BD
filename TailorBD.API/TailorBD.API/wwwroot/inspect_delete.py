# -*- coding: utf-8 -*-
import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'delete-order.html')

with open(path, encoding='utf-8') as f:
    c = f.read()

# Find and print the deleteInfo section
idx = c.find('deleteInfo')
print(repr(c[idx:idx+500]))
