import psycopg2
import hashlib
import pypinyin

def connect_db():
    """连接到PostgreSQL数据库"""
    con = psycopg2.connect(database="performance",
                           user="postgres",
                           password="postgres",
                           host="172.22.0.43",
                           port="5432")
    print(con)
    print("数据库连接成功")
    return con

def get_hash_id(emp_id):
    """计算emp_id的哈希值"""
    hash_obj = hashlib.md5(str(emp_id).encode())
    hash_id = hash_obj.hexdigest()
    return hash_id

def get_password(emp_id):
    """从hash_id获取后八位作为密码"""
    hash_id = get_hash_id(emp_id)
    return hash_id[-8:]

def to_pinyin(chinese_str):
    """将中文转换为全拼"""
    pinyin_list = pypinyin.lazy_pinyin(chinese_str)
    return ''.join(pinyin_list)

def process_user_data():
    """读取user表并写入user_credentials表"""
    con = connect_db()
    try:
        cur = con.cursor()

        # 检查数据库版本
        cur.execute('SELECT version()')
        db_version = cur.fetchone()
        print(f"数据库版本: {db_version}")

        # 读取user表中的emp_id和emp_name
        cur.execute('SELECT emp_id, emp_name FROM users')
        rows = cur.fetchall()

        for row in rows:
            emp_id = row[0]
            emp_name = row[1]

            # 计算哈希值
            hash_id = get_hash_id(emp_id)
            # 获取密码（哈希值后八位）
            password = get_password(emp_id)
            # 将中文名转换为拼音
            pinyin_name = to_pinyin(emp_name)

            # 将数据写入user_credentials表
            cur.execute(
                """
                INSERT INTO user_credentials (emp_id, username, password_hash)
                VALUES (%s, %s, %s)
                ON CONFLICT (emp_id) DO UPDATE 
                SET username = %s, password_hash = %s
                """,
                (emp_id, pinyin_name, password, pinyin_name, password)
            )

        # 提交事务
        con.commit()
        print(f"成功处理 {len(rows)} 条用户数据")

    except Exception as e:
        con.rollback()
        print(f"处理数据时出错: {e}")
    finally:
        con.close()
        print("数据库连接已关闭")

def reset_password(emp_id):
    """重置指定emp_id用户的密码"""
    con = connect_db()
    try:
        cur = con.cursor()

        # 计算新密码（哈希值后八位）
        new_password = get_password(emp_id)

        # 更新密码
        cur.execute(
            """
            UPDATE user_credentials
            SET password = %s
            WHERE emp_id = %s
            """,
            (new_password, emp_id)
        )

        # 检查是否找到并更新了记录
        if cur.rowcount > 0:
            con.commit()
            print(f"用户 {emp_id} 的密码已重置")
            return True
        else:
            print(f"未找到用户ID: {emp_id}")
            return False

    except Exception as e:
        con.rollback()
        print(f"重置密码时出错: {e}")
        return False
    finally:
        con.close()
        print("数据库连接已关闭")

# 主程序
if __name__ == "__main__":
    # 处理用户数据
    process_user_data()

    # 测试重置密码功能
    # 假设要重置用户ID为12345的密码
    # reset_password(12345)