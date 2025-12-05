import { supabase } from '../supabaseClient';
import { Product, Movement, Baptism, ChildPresentation, User, AppEvent, ProductType, AppSettings, Loan } from '../types';

// Helper para manejar respuestas de Supabase con mejor logging
const handleResponse = async <T>(query: any): Promise<T[]> => {
  const { data, error } = await query;
  if (error) {
    console.error('Supabase Error Detailed:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Error en base de datos');
  }
  return data || [];
};

const handleSingleResponse = async <T>(query: any): Promise<T | undefined> => {
    const { data, error } = await query;
    if (error && error.code !== 'PGRST116') { // Ignorar error "row not found" para búsquedas opcionales
        console.error('Supabase Single Error Detailed:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Error en base de datos');
    }
    return data || undefined;
};

export const dbAPI = {
  // --- Products ---
  async getAllProducts() {
    return handleResponse<Product>(
        supabase.from('products').select('*').order('type', { ascending: true }).order('name', { ascending: true })
    );
  },
  async addProduct(product: Product) {
    const { error } = await supabase.from('products').upsert(product);
    if (error) {
         console.error("Error adding product", JSON.stringify(error));
         throw error;
    }
  },
  async deleteProduct(code: string) {
    const { error } = await supabase.from('products').delete().eq('code', code);
    if (error) throw error;
  },
  async updateProductPricesByType(type: ProductType, newPrice: number) {
    const { error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('type', type);
    if (error) throw error;
  },

  // --- Movements ---
  async getAllMovements() {
    return handleResponse<Movement>(
        supabase.from('movements').select('*').order('date', { ascending: false })
    );
  },
  async addMovement(movement: Movement) {
    const { error } = await supabase.from('movements').insert(movement);
    if (error) throw error;
  },

  // --- Baptisms ---
  async getAllBaptisms() {
    return handleResponse<Baptism>(
        supabase.from('baptisms').select('*').order('createdAt', { ascending: false })
    );
  },
  async addBaptism(baptism: Baptism) {
    const { error } = await supabase.from('baptisms').insert(baptism);
    if (error) throw error;
  },
  async updateBaptism(baptism: Baptism) {
    // Supabase no le gusta recibir el objeto completo si tiene campos extraños, pero aquí debería estar bien
    const { error } = await supabase.from('baptisms').update(baptism).eq('id', baptism.id);
    if (error) throw error;
  },
  async deleteBaptism(id: string) {
    const { error } = await supabase.from('baptisms').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Presentations ---
  async getAllPresentations() {
    return handleResponse<ChildPresentation>(
        supabase.from('presentations').select('*').order('createdAt', { ascending: false })
    );
  },
  async addPresentation(presentation: ChildPresentation) {
    const { error } = await supabase.from('presentations').insert(presentation);
    if (error) throw error;
  },
  async updatePresentation(presentation: ChildPresentation) {
    const { error } = await supabase.from('presentations').update(presentation).eq('id', presentation.id);
    if (error) throw error;
  },
  async deletePresentation(id: string) {
    const { error } = await supabase.from('presentations').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Loans (Préstamos) ---
  async getAllLoans() {
    return handleResponse<Loan>(
        supabase.from('loans').select('*').order('status', { ascending: false }).order('loanDate', { ascending: false })
    );
  },
  async addLoan(loan: Loan) {
    const { error } = await supabase.from('loans').insert(loan);
    if (error) throw error;
  },
  async updateLoan(loan: Loan) {
    const { error } = await supabase.from('loans').update(loan).eq('id', loan.id);
    if (error) throw error;
  },
  async deleteLoan(id: string) {
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Events ---
  async getAllEvents() {
    return handleResponse<AppEvent>(
        supabase.from('events').select('*').order('createdAt', { ascending: false })
    );
  },
  async addEvent(event: AppEvent) {
    const { error } = await supabase.from('events').insert(event);
    if (error) throw error;
  },
  async updateEvent(event: AppEvent) {
    const { error } = await supabase.from('events').update(event).eq('id', event.id);
    if (error) throw error;
  },
  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Settings ---
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'app_config')
      .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("Error getting settings:", JSON.stringify(error));
    }
    return data?.value as AppSettings | undefined;
  },
  async saveSettings(settings: AppSettings) {
    const { error } = await supabase.from('settings').upsert({
      id: 'app_config',
      value: settings
    });
    if (error) throw error;
  },

  // --- Users / Auth ---
  async getUser(username: string) {
    return handleSingleResponse<User>(
        supabase.from('users').select('*').eq('username', username).single()
    );
  },
  
  async checkUserExists(username: string): Promise<boolean> {
    const user = await this.getUser(username);
    return !!user;
  },

  async countAdmins() {
    const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ADMIN');
    
    if (error) throw error;
    return count || 0;
  },

  async ensureFixedAdmin(adminUser: User) {
    // Primero verificamos si podemos conectar
    const { error: connectionError } = await supabase.from('users').select('username').limit(1);
    if (connectionError) {
        // Si la tabla no existe o hay error de conexión, fallamos con detalle
        console.error("Failed to connect to users table. Did you run the SQL script?", JSON.stringify(connectionError));
        return; // Salimos silenciosamente para no crashear toda la app si la DB no está lista
    }

    const existing = await this.getUser(adminUser.username);
    
    if (!existing) {
        const { error } = await supabase.from('users').insert(adminUser);
        if (error) console.error("Error creating admin:", JSON.stringify(error));
    } else {
        if (existing.password !== adminUser.password) {
            await supabase.from('users').update({ 
                password: adminUser.password, 
                role: 'ADMIN' 
            }).eq('username', adminUser.username);
        }
    }
  },

  async registerUser(user: User) {
    const exists = await this.checkUserExists(user.username);
    if (exists) {
      throw new Error(`¡Atención! El usuario "${user.username}" ya se encuentra registrado.`);
    }

    if (user.role === 'ADMIN') {
      const adminCount = await this.countAdmins();
      if (adminCount >= 1) {
        throw new Error('Ya existe un Administrador registrado.');
      }
    }

    const { error } = await supabase.from('users').insert(user);
    if (error) throw error;
  }
};