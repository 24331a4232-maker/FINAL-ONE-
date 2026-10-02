import re

# 1. First, recreate clean DonateFoodPage from fix_donate_food logic
with open('/fix_donate_food.py') as f:
    pass

# Let's run fix_donate_food.py to reset DonateFoodPage to a good state
import fix_donate_food

for base in ['public/assets', 'dist/assets']:
    fpath = f'{base}/DonateFoodPage-BoFiNydc.js'
    with open(fpath) as f:
        code = f.read()

    # Locate photo upload card
    pos_desc = code.find('Describe the food items, packaging, etc.')
    if pos_desc != -1:
        # Find the card containing Food Image right after Description
        pos_card_start = code.find('e.jsxs(o.div,{variants:m,children:[e.jsxs("label",{className:"block text-sm font-medium mb-1.5 flex items-center gap-1.5",children:[e.jsx(Fe,', pos_desc)
        if pos_card_start != -1:
            pos_card_end = code.find('e.jsxs(o.div,{variants:m,children:[e.jsx(w,{type:"submit"', pos_card_start)
            if pos_card_end != -1:
                code = code[:pos_card_start] + code[pos_card_end:]
                print(f'Successfully removed photo upload card from {fpath}')

    with open(fpath, 'w') as f_out:
        f_out.write(code)

print('Done fixing DonateFoodPage!')
